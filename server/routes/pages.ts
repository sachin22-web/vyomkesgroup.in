import { RequestHandler } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth } from "./auth";
import { Page, PageDoc } from "../models/Page";
import mongoose, { Model } from "mongoose";
import { isDbConnected } from "../db";

const pageSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, and use hyphens for spaces."),
  content: z.string().min(1),
  bannerImageUrl: z.string().url().optional().or(z.literal("")), // New field, allow empty string
  inHeader: z.boolean().optional(),
  inFooter: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const createPage: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "Database not configured" });

    const parsed = pageSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid body", errors: parsed.error.errors });

    const { title, slug, content, bannerImageUrl, inHeader, inFooter, isActive, sortOrder } = parsed.data;

    try {
      const newPage = await (Page as Model<PageDoc>).create({
        title,
        slug,
        content,
        bannerImageUrl: bannerImageUrl || undefined, // Store undefined if empty string
        inHeader: inHeader ?? false,
        inFooter: inFooter ?? false,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      });
      res.status(201).json(newPage);
    } catch (e: any) {
      if (e.code === 11000) { // Duplicate key error for unique slug
        return res.status(409).json({ message: "Page with this slug already exists." });
      }
      console.error("Error creating page:", e);
      res.status(500).json({ message: "Failed to create page" });
    }
  },
];

export const listAdminPages: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (_req, res) => {
    if (!isDbConnected())
      return res.json([]);

    try {
      const pages = await (Page as Model<PageDoc>).find({})
        .sort({ sortOrder: 1, createdAt: -1 })
        .lean();
      res.json(pages);
    } catch (e: any) {
      console.error("Error listing admin pages:", e);
      res.status(500).json({ message: "Failed to fetch pages" });
    }
  },
];

export const getPublicPageBySlug: RequestHandler = async (req, res) => {
  if (!isDbConnected())
    return res.status(404).json({ message: "Page not found (DB not configured)" });

  const { slug } = req.params;

  try {
    const page = await (Page as Model<PageDoc>).findOne({ slug, isActive: true }).lean();
    if (!page) {
      return res.status(404).json({ message: "Page not found" });
    }
    res.json(page);
  } catch (e: any) {
    console.error("Error fetching public page by slug:", e);
    res.status(500).json({ message: "Failed to fetch page" });
  }
};

export const updatePage: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "Database not configured" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid page ID" });

    const parsed = pageSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid body", errors: parsed.error.errors });

    const updates = parsed.data;

    try {
      const updatedPage = await (Page as Model<PageDoc>).findByIdAndUpdate(
        id,
        { $set: { ...updates, bannerImageUrl: updates.bannerImageUrl || undefined } }, // Store undefined if empty string
        { new: true, runValidators: true }
      );
      if (!updatedPage) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json(updatedPage);
    } catch (e: any) {
      if (e.code === 11000) { // Duplicate key error for unique slug
        return res.status(409).json({ message: "Page with this slug already exists." });
      }
      console.error("Error updating page:", e);
      res.status(500).json({ message: "Failed to update page" });
    }
  },
];

export const deletePage: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "Database not configured" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid page ID" });

    try {
      const deletedPage = await (Page as Model<PageDoc>).findByIdAndDelete(id);
      if (!deletedPage) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json({ message: "Page deleted successfully" });
    } catch (e: any) {
      console.error("Error deleting page:", e);
      res.status(500).json({ message: "Failed to delete page" });
    }
  },
];

export const getNavPages: RequestHandler = async (_req, res) => {
  if (!isDbConnected())
    return res.json([]); // Return empty array in demo mode

  try {
    const navPages = await (Page as Model<PageDoc>).find({
      isActive: true,
      $or: [{ inHeader: true }, { inFooter: true }],
    })
      .select("title slug inHeader inFooter sortOrder")
      .sort({ sortOrder: 1, title: 1 })
      .lean();
    res.json(navPages);
  } catch (e: any) {
    console.error("Error fetching navigation pages:", e);
    res.status(500).json({ message: "Failed to fetch navigation pages" });
  }
};