import mongoose, { Schema, InferSchemaType, model, Model } from "mongoose";

const KYCSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
      index: true,
    },
    docType: {
      type: String,
      enum: ["aadhaar", "pan", "passport", "other"],
    },
    docNumber: { type: String },
    frontUrl: { type: String },
    backUrl: { type: String },
    selfieUrl: { type: String },
    remarks: { type: String },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewerId: { type: Schema.Types.ObjectId, ref: "User" },
    // legacy fields kept for backwards compatibility
    pan: String,
    aadhaarMasked: String,
    addressProofUrl: String,
    bank: {
      acc: String,
      ifsc: String,
      name: String,
      verified: { type: Boolean, default: false },
    },
    reason: String,
  },
  { _id: false },
);

const DeviceSchema = new Schema(
  {
    ua: String,
    ip: String,
    lastLoginAt: Date,
  },
  { _id: false },
);

const UserSchema = new Schema(
  {
    name: { type: String, trim: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      trim: true,
      index: true,
      unique: true,
      sparse: true,
    },
    passwordHash: String,
    oauthProvider: String,
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
      index: true,
    },
    kyc: { type: KYCSchema, default: {} },
    referral: {
      code: String,
      referredBy: String,
      earnings: { type: Number, default: 0 },
      tier: { type: Number, default: 1 },
      banned: { type: Boolean, default: false },
    },
    roles: { type: [String], default: ["user"], index: true },
    devices: { type: [DeviceSchema], default: [] },
    passwordReset: {
      token: String,
      expiresAt: Date,
    },
    // New wallet fields
    balance: { type: Number, default: 0 }, // Spendable balance
    locked: { type: Number, default: 0 },   // On-hold balance for withdrawals
    totalProfit: { type: Number, default: 0 }, // Total profit earned by user
    totalPayout: { type: Number, default: 0 }, // Total payouts received by user
  },
  { timestamps: true, collection: "users" },
);

UserSchema.index({ "kyc.status": 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ "referral.code": 1 }, { unique: true, sparse: true }); // Index for referral code

export type UserDoc = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User: Model<UserDoc> =
  (mongoose.models.User as any) ||
  model("User", UserSchema);