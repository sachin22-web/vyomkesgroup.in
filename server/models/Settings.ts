import mongoose, { Schema, InferSchemaType, model, Model } from "mongoose";

const PaymentSettingsSchema = new Schema(
  {
    bankAccountName: { type: String, trim: true },
    bankAccountNumber: { type: String, trim: true },
    bankIfscCode: { type: String, trim: true },
    upiId: { type: String, trim: true },
    qrCodeUrl: { type: String, trim: true },
  },
  { _id: false }
);

const SettingsSchema = new Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g., 'payment'
    payment: { type: PaymentSettingsSchema, default: {} },
    // Add other settings here as needed
  },
  { timestamps: true, collection: "settings" }
);

export type SettingsDoc = InferSchemaType<typeof SettingsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Settings: Model<SettingsDoc> =
  (mongoose.models.Settings as any) ||
  model("Settings", SettingsSchema);