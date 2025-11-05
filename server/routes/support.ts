import { RequestHandler } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth } from "./auth";
import { SupportTicket, SupportTicketDoc } from "../models/SupportTicket";
import { User, UserDoc } from "../models/User";
import mongoose, { Model } from "mongoose";
import { isDbConnected } from "../db";

const createTicketSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(2000),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

export const createSupportTicket: RequestHandler[] = [
  requireAuth,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "Database not configured" });

    const parsed = createTicketSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid body" });

    const { subject, message, priority } = parsed.data;
    const userId = (req as any).user.sub;

    try {
      const ticket = await (SupportTicket as Model<SupportTicketDoc>).create({
        userId: new mongoose.Types.ObjectId(userId),
        subject,
        message,
        priority,
        status: "open",
      });
      res.status(201).json(ticket);
    } catch (e: any) {
      console.error("Error creating support ticket:", e);
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  },
];

const listTicketsQuerySchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const listSupportTickets: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.json({ items: [], total: 0, page: 1, limit: 20 });

    const parsed = listTicketsQuerySchema.safeParse(req.query);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid query" });

    const { status, priority, search, page, limit } = parsed.data;

    const filter: any = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    
    let userIds: mongoose.Types.ObjectId[] = [];
    if (search) {
      // Search in ticket fields
      filter.$or = [
        { subject: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
        { adminNotes: { $regex: search, $options: "i" } },
      ];

      // Also search in user details and get matching user IDs
      const matchingUsers = await (User as Model<UserDoc>).find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      }).select('_id').lean();
      userIds = matchingUsers.map(u => u._id);

      if (userIds.length > 0) {
        // If there are existing $or conditions, add userId to them
        if (filter.$or) {
          filter.$or.push({ userId: { $in: userIds } });
        } else {
          // Otherwise, create a new $or condition for userId
          filter.$or = [{ userId: { $in: userIds } }];
        }
      }
    }

    const skip = (page - 1) * limit;

    const [ticketsRaw, total] = await Promise.all([
      (SupportTicket as Model<SupportTicketDoc>).find(filter)
        .populate("userId", "name email phone") // Populate user details
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      (SupportTicket as Model<SupportTicketDoc>).countDocuments(filter),
    ]);

    const items = ticketsRaw.map((ticket: any) => ({
      id: String(ticket._id),
      userId: String(ticket.userId?._id), // Added optional chaining
      userName: ticket.userId?.name,      // Added optional chaining
      userEmail: ticket.userId?.email,    // Added optional chaining
      userPhone: ticket.userId?.phone,    // Added optional chaining
      subject: ticket.subject,
      message: ticket.message,
      priority: ticket.priority,
      status: ticket.status,
      adminNotes: ticket.adminNotes,
      createdAt: ticket.createdAt,
      resolvedAt: ticket.resolvedAt,
      resolvedBy: ticket.resolvedBy ? String(ticket.resolvedBy) : undefined,
    }));

    res.json({ items, total, page, limit });
  },
];

// New endpoint for users to list their own support tickets
export const listUserSupportTickets: RequestHandler[] = [
  requireAuth,
  async (req, res) => {
    if (!isDbConnected())
      return res.json({ items: [], total: 0, page: 1, limit: 20 });

    const userId = (req as any).user.sub;
    const parsed = listTicketsQuerySchema.safeParse(req.query); // Reuse schema for query params
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid query" });

    const { status, priority, search, page, limit } = parsed.data;

    const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [ticketsRaw, total] = await Promise.all([
      (SupportTicket as Model<SupportTicketDoc>).find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      (SupportTicket as Model<SupportTicketDoc>).countDocuments(filter),
    ]);

    const items = ticketsRaw.map((ticket: any) => ({
      id: String(ticket._id),
      userId: String(ticket.userId),
      subject: ticket.subject,
      message: ticket.message,
      priority: ticket.priority,
      status: ticket.status,
      adminNotes: ticket.adminNotes, // Include admin notes
      createdAt: ticket.createdAt,
      resolvedAt: ticket.resolvedAt,
    }));

    res.json({ items, total, page, limit });
  },
];

const updateTicketSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  adminNotes: z.string().trim().optional(),
});

export const updateSupportTicket: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "Database not configured" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid ticket ID" });

    const parsed = updateTicketSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid body" });

    const updates = parsed.data;
    const adminId = (req as any).user.sub;

    try {
      const ticket = await (SupportTicket as Model<SupportTicketDoc>).findById(id);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      if (updates.status) ticket.status = updates.status;
      if (updates.priority) ticket.priority = updates.priority;
      if (updates.adminNotes !== undefined) ticket.adminNotes = updates.adminNotes;

      if (ticket.status === "resolved" && !ticket.resolvedAt) {
        ticket.resolvedAt = new Date();
        ticket.resolvedBy = new mongoose.Types.ObjectId(adminId);
      } else if (ticket.status !== "resolved" && ticket.resolvedAt) {
        ticket.resolvedAt = undefined;
        ticket.resolvedBy = undefined;
      }

      await ticket.save();
      res.json(ticket);
    } catch (e: any) {
      console.error("Error updating support ticket:", e);
      res.status(500).json({ message: "Failed to update support ticket" });
    }
  },
];