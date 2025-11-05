import mongoose, { Schema, InferSchemaType, model, Model } from "mongoose";

const PageSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    content: { type: String, required: true }, // HTML content for the page
    bannerImageUrl: { type: String, trim: true }, // New field for banner image
    inHeader: { type: Boolean, default: false },
    inFooter: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true, collection: "pages" }
);

export type PageDoc = InferSchemaType<typeof PageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Page: Model<PageDoc> =
  (mongoose.models.Page as any) ||
  model("Page", PageSchema);