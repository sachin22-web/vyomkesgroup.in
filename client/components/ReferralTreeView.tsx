import { useState } from "react";
import { ChevronDown, ChevronRight, User, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface TreeNode {
  id: string;
  name: string;
  email: string;
  phone?: string;
  referralCode?: string;
  referralEarnings: number;
  children: TreeNode[];
}

interface ReferralTreeViewProps {
  node: TreeNode | null;
  onNodeClick?: (node: TreeNode) => void;
}

function TreeNodeComponent({ node, level = 0, onNodeClick }: { node: TreeNode; level?: number; onNodeClick?: (node: TreeNode) => void }) {
  const [expanded, setExpanded] = useState(level < 2); // Expand first 2 levels by default

  const hasChildren = node.children && node.children.length > 0;
  const isRoot = node.id === "root";

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
          !isRoot && "hover:bg-accent/20"
        )}
        style={{ marginLeft: `${level * 16}px` }}
      >
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-6" />}

        {!isRoot && (
          <div
            className="flex items-center gap-3 flex-1 cursor-pointer"
            onClick={() => onNodeClick?.(node)}
          >
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{node.name}</div>
              <div className="text-xs text-muted-foreground truncate">{node.email}</div>
            </div>
            {node.referralCode && (
              <div className="text-xs bg-secondary px-2 py-1 rounded text-secondary-foreground flex-shrink-0">
                {node.referralCode}
              </div>
            )}
            {node.referralEarnings > 0 && (
              <div className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 flex-shrink-0">
                <DollarSign className="h-3 w-3" />
                ₹{node.referralEarnings.toLocaleString("en-IN")}
              </div>
            )}
          </div>
        )}

        {isRoot && (
          <div className="text-lg font-bold">
            {node.name} ({node.children.length} direct referrers)
          </div>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="border-l border-gray-300 dark:border-gray-700 ml-2">
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReferralTreeView({ node, onNodeClick }: ReferralTreeViewProps) {
  if (!node) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No referral tree data available. Make sure referrals exist in the system.
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card p-4 overflow-auto max-h-[600px]">
      <TreeNodeComponent node={node} onNodeClick={onNodeClick} />
    </div>
  );
}
