import mongoose, { Schema, InferSchemaType, model, Model } from "mongoose";

const SupportTicketSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    priority: { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal" },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open", index: true },
    adminNotes: { type: String, trim: true },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" }, // Admin who resolved it
  },
  { timestamps: true, collection: "support_tickets" }
);

export type SupportTicketDoc = InferSchemaType<typeof SupportTicketSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SupportTicket: Model<SupportTicketDoc> =
  (mongoose.models.SupportTicket as any) ||
  model("SupportTicket", SupportTicketSchema);