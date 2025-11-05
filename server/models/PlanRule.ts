import mongoose, { Schema, InferSchemaType, model, Model } from "mongoose";

const BandSchema = new Schema(
  {
    fromMonth: { type: Number, required: true },
    toMonth: { type: Number, required: true },
    monthlyRate: { type: Number, required: true },
  },
  { _id: false },
);

const PlanRuleSchema = new Schema(
  {
    name: { type: String, required: true },
    minAmount: { type: Number, required: true, default: 100000 }, // Updated default to 100,000
    specialMin: { type: Number, required: true, default: 300000 }, // Updated specialMin for booster
    bands: { type: [BandSchema], required: true },
    specialRate: { type: Number, required: true, default: 0.1 },
    adminCharge: { type: Number, required: true, default: 0.04 }, // Updated admin charge to 4%
    booster: { type: Number, required: true, default: 0.1 }, // Booster gives 10% additional income
    active: { type: Boolean, default: false }, // Changed default to false
    version: { type: Number, required: true, default: 1 },
    effectiveFrom: { type: Date, required: true, default: () => new Date() }, // Changed to function
    createdBy: { type: String },
  },
  { timestamps: true },
);

export type PlanRuleDoc = InferSchemaType<typeof PlanRuleSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const PlanRule: Model<PlanRuleDoc> =
  (mongoose.models.PlanRule as any) ||
  model("PlanRule", PlanRuleSchema);