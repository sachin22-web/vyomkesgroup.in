import mongoose, { Schema, InferSchemaType, model, Model } from "mongoose";

interface InvestmentMeta {
  planName: string;
  monthDuration: number;
  boosterApplied: boolean;
  annualReturnPercent?: number;
}

const InvestmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    principal: { type: Number, required: true },
    method: { type: String, enum: ["upi", "bank", "pg", "manual_transfer"], default: "manual_transfer" },
    proofUrl: String,
    utr: String,
    status: {
      type: String,
      enum: [
        "initiated",
        "under_review",
        "approved",
        "active",
        "completed",
        "cancelled",
        "rejected",
      ],
      default: "initiated",
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    planVersion: { type: Number, default: 1 },
    referredBy: String,
    notes: String,
    meta: { type: Object, default: {} }, // Changed to Object and added default
    payouts: [{ type: Schema.Types.ObjectId, ref: "Payout" }], // Changed to store ObjectId references
  },
  { timestamps: true },
);

const LedgerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    investmentId: { type: Schema.Types.ObjectId, ref: "Investment" },
    withdrawalId: { type: Schema.Types.ObjectId, ref: "Withdrawal" }, // New field for withdrawal reference
    payoutId: { type: Schema.Types.ObjectId, ref: "Payout" }, // New field for payout reference
    type: { type: String, required: true }, // e.g., 'investment_credit', 'payout_credit', 'withdrawal_debit', 'admin_charge', 'referral_payout', 'manual_adjustment', 'profit', 'payout_book'
    direction: { type: String, enum: ["credit", "debit", "none"], required: true }, // Added 'none' for bookkeeping
    amount: { type: Number, required: true },
    balanceBefore: { type: Number }, // New field
    balanceAfter: { type: Number }, // Made optional
    lockedBefore: { type: Number }, // New field
    lockedAfter: { type: Number }, // New field
    note: { type: String }, // New field for admin notes/reason
    refId: { type: String }, // New field for external reference ID (e.g., UTR)
    meta: Schema.Types.Mixed, // Store additional details like charges, net amount, etc.
  },
  { timestamps: true },
);

const PayoutSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    investmentId: { type: Schema.Types.ObjectId, ref: "Investment" },
    monthNo: Number,
    dueDate: { type: Date, required: true }, // Added dueDate
    grossPayout: Number,
    adminCharge: Number,
    booster: Number,
    tds: Number,
    netPayout: Number,
    status: {
      type: String,
      enum: ["scheduled", "processing", "paid", "failed", "reprocessing", "on_hold", "pending"], // Added on_hold and pending
      default: "scheduled",
    },
    paidAt: Date,
    rrn: String,
    gateway: String,
  },
  { timestamps: true },
);

const WithdrawalSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
    amount: { type: Number, required: true }, // Requested amount
    source: {
      type: String,
      enum: ["earnings", "referral"],
      default: "earnings",
    },
    charges: { type: Number, default: 0 },
    tds: { type: Number, default: 0 },
    netAmount: { type: Number, required: true }, // Amount after charges and TDS
    status: {
      type: String,
      enum: [
        "requested",        // User requested, amount locked
        "under_admin_review", // Admin is reviewing
        "approved",         // Admin approved, amount debited from balance, still might be pending bank transfer
        "paid",             // Amount successfully transferred to user's bank
        "rejected",         // Admin rejected, amount unlocked
        "failed",           // Bank transfer failed after approval
      ],
      default: "requested",
    },
    reason: { type: String }, // Reason for rejection
    paidAt: { type: Date },   // Date when amount was actually paid to user
    rrn: { type: String },    // Reference number for bank transaction
    gateway: { type: String }, // Payment gateway used for payout
  },
  { timestamps: true },
);

export type InvestmentDoc = InferSchemaType<typeof InvestmentSchema> & {
  _id: mongoose.Types.ObjectId;
  meta?: InvestmentMeta; // Explicitly type meta here
  payouts?: mongoose.Types.ObjectId[]; // Changed to ObjectId[]
};
export type LedgerDoc = InferSchemaType<typeof LedgerSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type PayoutDoc = InferSchemaType<typeof PayoutSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type WithdrawalDoc = InferSchemaType<typeof WithdrawalSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Investment: Model<InvestmentDoc> =
  (mongoose.models.Investment as any) ||
  model("Investment", InvestmentSchema);
export const Ledger: Model<LedgerDoc> =
  (mongoose.models.Ledger as any) ||
  model("Ledger", LedgerSchema);
export const Payout: Model<PayoutDoc> =
  (mongoose.models.Payout as any) ||
  model("Payout", PayoutSchema);
export const Withdrawal: Model<WithdrawalDoc> =
  (mongoose.models.Withdrawal as any) ||
  model("Withdrawal", WithdrawalSchema);

// Indexes
InvestmentSchema.index({ userId: 1, createdAt: -1 });
LedgerSchema.index({ userId: 1, createdAt: -1 });
PayoutSchema.index({ userId: 1, createdAt: -1 });
WithdrawalSchema.index({ status: 1, createdAt: -1 });