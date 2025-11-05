import mongoose, { Schema, InferSchemaType, model, Model } from "mongoose";

const ContactEnquirySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["new", "in_progress", "resolved", "closed"], default: "new" },
    adminNotes: { type: String, trim: true },
  },
  { timestamps: true, collection: "contact_enquiries" }
);

export type ContactEnquiryDoc = InferSchemaType<typeof ContactEnquirySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ContactEnquiry: Model<ContactEnquiryDoc> =
  (mongoose.models.ContactEnquiry as any) ||
  model("ContactEnquiry", ContactEnquirySchema);