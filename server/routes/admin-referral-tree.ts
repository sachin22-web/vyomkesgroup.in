import { RequestHandler, Request, Response } from "express";
import { User, UserDoc } from "../models/User";
import { Model } from "mongoose";
import { isDbConnected } from "../db";

interface TreeNode {
  id: string;
  name: string;
  email: string;
  phone?: string;
  referralCode?: string;
  referralEarnings: number;
  children: TreeNode[];
}

export const getReferralTree: RequestHandler = async (req: Request, res: Response) => {
  try {
    // Auth is enforced by requireAuth + requireAdmin in server/index.ts.
    // This handler assumes req.user is an authenticated admin.
    if (!isDbConnected()) {
      return res.json({ tree: null, totalUsers: 0 });
    }

    // Get the user to start from (default to fetch all root users)
    const userId = req.query.userId as string;

    // Fetch all users with referral info
    const users = await (User as Model<UserDoc>)
      .find()
      .select("_id name email phone status referral.code referral.referredBy referral.earnings createdAt")
      .lean();

    // Create a map for quick lookup
    const userMap = new Map(users.map(u => [String(u._id), u]));

    // Build tree structure
    const buildTree = (userId: string): TreeNode | null => {
      const user = userMap.get(userId);
      if (!user) return null;

      // Find all direct referrals for this user
      const children = users
        .filter(u => String(u.referral?.referredBy) === userId)
        .map(child => buildTree(String(child._id)))
        .filter((node): node is TreeNode => node !== null);

      return {
        id: userId,
        name: user.name || "Unknown",
        email: user.email || "",
        phone: user.phone,
        referralCode: user.referral?.code,
        referralEarnings: user.referral?.earnings || 0,
        children,
      };
    };

    let tree: TreeNode | null = null;

    if (userId) {
      // Get tree for specific user
      tree = buildTree(userId);
    } else {
      // Get all root users (users without referrer) and build forest
      const rootUsers = users.filter(u => !u.referral?.referredBy);
      
      if (rootUsers.length > 0) {
        // Create a virtual root node containing all root users as children
        const rootChildren = rootUsers
          .map(user => buildTree(String(user._id)))
          .filter((node): node is TreeNode => node !== null);

        tree = {
          id: "root",
          name: "All Referrals",
          email: "",
          referralEarnings: rootChildren.reduce((sum, child) => sum + getTotalEarnings(child), 0),
          children: rootChildren,
        };
      }
    }

    res.json({ tree, totalUsers: users.length });
  } catch (e: any) {
    console.error("[Admin Referral Tree] Error:", e.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Helper function to calculate total earnings recursively
function getTotalEarnings(node: TreeNode): number {
  return node.referralEarnings + node.children.reduce((sum, child) => sum + getTotalEarnings(child), 0);
}
