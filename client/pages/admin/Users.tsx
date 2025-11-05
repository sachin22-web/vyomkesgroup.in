import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch"; // Import Switch for make/remove admin
import { UserWalletAdjustmentDialog } from "@/components/admin/UserWalletAdjustmentDialog"; // Import the new dialog
import { Img } from "@/components/Img"; // Import the Img component
import { useListActions } from "@/hooks/use-list-actions"; // Import the new hook
import { BulkActionsBar } from "@/components/BulkActionsBar"; // Import the new component
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { Seo } from "@/components/Seo"; // Import Seo component

type UserItem = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: "user" | "admin";
  status: "active" | "blocked";
  kycStatus: "not_submitted" | "pending" | "approved" | "rejected";
  kycDocMasked?: string;
  createdAt: string;
};

type Stats = {
  total: number;
  todaySignups: number;
  active: number;
  blocked: number;
  kycPending: number;
  kycApproved: number;
  kycRejected: number;
};

export default function AdminUsers() {
  const { user } = useAuth();
  const [items, setItems] = useState<UserItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>("all"); // Changed initial state from "" to "all"
  const [status, setStatus] = useState<string>("all"); // Changed initial state from "" to "all"
  const [kycStatus, setKycStatus] = useState<string>("all"); // Changed initial state from "" to "all"
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", status: "active", makeAdmin: false, removeAdmin: false });
  const limit = 10;

  const [isWalletAdjustDialogOpen, setIsWalletAdjustDialogOpen] = useState(false);
  const [selectedUserIdForWallet, setSelectedUserIdForWallet] = useState<string | null>(null);


  const filters = useMemo(() => {
    const f: Record<string, any> = {};
    if (q) f.search = q;
    if (role !== "all") f.role = role;
    if (status !== "all") f.status = status;
    if (kycStatus !== "all") f.kycStatus = kycStatus;
    f.page = String(page);
    f.limit = String(limit);
    return f;
  }, [q, role, status, kycStatus, page]);

  const params = useMemo(() => new URLSearchParams(filters).toString(), [filters]);

  const loadUsers = async () => {
    const r = await fetch(`/api/admin/users?${params}`, {
      credentials: "include",
    });
    if (!r.ok) return;
    const j = await r.json();
    setItems(j.items);
    setTotal(j.total);
    setStats(j.stats);
  };

  useEffect(() => {
    let cancelled = false;
    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [params]);

  const {
    selectedIds,
    toggleSelection,
    toggleAllSelection,
    handleDeleteSelected,
    handleDeleteAllFiltered,
    handleDownloadCsv,
    isDeleting,
    allItemsSelected,
    getItemId,
  } = useListActions({
    resourceName: "users",
    items,
    totalItems: total,
    filters,
    fetchItems: loadUsers,
    idKey: "id",
  });

  const toggleBlock = async (id: string) => {
    const r = await fetch(`/api/admin/users/${id}/block`, {
      method: "PATCH",
      credentials: "include",
    });
    if (!r.ok) return;
    const j = await r.json();
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: j.status } : it)),
    );
  };

  const startEdit = (u: UserItem) => {
    setEditing(u);
    setForm({
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      status: u.status,
      makeAdmin: u.role === "admin", // Pre-fill based on current role
      removeAdmin: u.role === "user", // Pre-fill based on current role
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const r = await fetch(`/api/admin/users/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    if (r.ok) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === editing.id
            ? { ...it, name: form.name, email: form.email, phone: form.phone, status: form.status as any, role: form.makeAdmin ? "admin" : (form.removeAdmin ? "user" : it.role) }
            : it,
        ),
      );
      setEditing(null);
    }
  };

  const openWalletAdjustment = (userId: string) => {
    setSelectedUserIdForWallet(userId);
    setIsWalletAdjustDialogOpen(true);
  };

  const handleWalletAdjusted = () => {
    loadUsers(); // Refresh user list to show updated balances
  };

  return (
    <>
      <Seo title="Admin Users" description="Manage user accounts, roles, KYC status, and perform wallet adjustments." />
      <div className="grid gap-4">
        <h1 className="text-2xl font-semibold">Users & KYC</h1> {/* Changed to h1 */}

        <Img
          src="/images/admin_users_kyc.jpg"
          alt="Admin panel for user and KYC management"
          className="w-full h-48 object-cover rounded-xl border"
        />

        <Card>
          <CardContent className="p-5 grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
            <Label htmlFor="search" className="md:col-span-1">
              Search
            </Label>
            <Input
              id="search"
              className="md:col-span-2"
              placeholder="Name, email, phone…"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
            />
            <Select
              value={role} // Use role directly
              onValueChange={(v) => {
                setPage(1);
                setRole(v); // Set role directly
              }}
            >
              <SelectTrigger className="md:col-span-1">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={status} // Use status directly
              onValueChange={(v) => {
                setPage(1);
                setStatus(v); // Set status directly
              }}
            >
              <SelectTrigger className="md:col-span-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={kycStatus} // Use kycStatus directly
              onValueChange={(v) => {
                setPage(1);
                setKycStatus(v); // Set kycStatus directly
              }}
            >
              <SelectTrigger className="md:col-span-1">
                <SelectValue placeholder="KYC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All KYC</SelectItem>
                <SelectItem value="not_submitted">Not Submitted</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <div className="md:col-span-1 flex justify-end">
              <Button variant="outline" onClick={handleDownloadCsv}>
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {stats && (
          <Card>
            <CardContent className="p-5 grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
              <div>
                Total: <span className="font-medium">{stats.total}</span>
              </div>
              <div>
                Today: <span className="font-medium">{stats.todaySignups}</span>
              </div>
              <div>
                Active: <span className="font-medium">{stats.active}</span>
              </div>
              <div>
                Blocked: <span className="font-medium">{stats.blocked}</span>
              </div>
              <div>
                KYC Pending:{" "}
                <span className="font-medium">{stats.kycPending}</span>
              </div>
              <div>
                KYC Approved:{" "}
                <span className="font-medium">{stats.kycApproved}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <BulkActionsBar
          selectedCount={selectedIds.length}
          totalItems={total}
          onDeleteSelected={handleDeleteSelected}
          onDeleteAllFiltered={handleDeleteAllFiltered}
          onDownloadCsv={handleDownloadCsv}
          isDeleting={isDeleting}
          resourceName="users"
        />

        <Card>
          <CardContent className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">
                      <Checkbox
                        checked={allItemsSelected}
                        onCheckedChange={toggleAllSelection}
                        aria-label="Select all users"
                      />
                    </th>
                    <th className="py-2">Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>KYC</th>
                    <th>Doc</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((u) => (
                    <tr key={u.id} className="border-b">
                      <td className="py-2 pr-3">
                        <Checkbox
                          checked={selectedIds.includes(u.id)}
                          onCheckedChange={() => toggleSelection(u.id)}
                          aria-label={`Select user ${u.name}`}
                        />
                      </td>
                      <td className="py-2">{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.phone}</td>
                      <td>
                        <span className="capitalize">{u.role}</span>
                      </td>
                      <td>
                        <span
                          className={
                            u.status === "active"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {u.status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            u.kycStatus === "approved"
                              ? "text-green-600"
                              : u.kycStatus === "rejected"
                                ? "text-red-600"
                                : u.kycStatus === "pending"
                                  ? "text-yellow-600"
                                  : "text-muted-foreground"
                          }
                        >
                          {(u.kycStatus || 'not_submitted').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>{u.kycDocMasked || ""}</td>
                      <td>{new Date(u.createdAt).toLocaleString()}</td>
                      <td className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(u)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleBlock(u.id)}
                        >
                          {u.status === "active" ? "Block" : "Unblock"}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => openWalletAdjustment(u.id)}>
                          Adjust Wallet
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm gap-2">
              <div>
                Page {page} / {Math.max(1, Math.ceil(total / limit))}
              </div>
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= Math.ceil(total / limit)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit user</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <div>
                <Label htmlFor="editName">Name</Label>
                <Input id="editName" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="editEmail">Email</Label>
                <Input id="editEmail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="editPhone">Phone</Label>
                <Input id="editPhone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="editStatus">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger id="editStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Switch id="makeAdmin" checked={form.makeAdmin} onCheckedChange={(e) => setForm({ ...form, makeAdmin: e, removeAdmin: false })} />
                  <Label htmlFor="makeAdmin">Make admin</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="removeAdmin" checked={form.removeAdmin} onCheckedChange={(e) => setForm({ ...form, removeAdmin: e, makeAdmin: false })} />
                  <Label htmlFor="removeAdmin">Remove admin</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={saveEdit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {selectedUserIdForWallet && (
          <UserWalletAdjustmentDialog
            open={isWalletAdjustDialogOpen}
            onOpenChange={setIsWalletAdjustDialogOpen}
            userId={selectedUserIdForWallet}
            onWalletAdjusted={handleWalletAdjusted}
          />
        )}
      </div>
    </>
  );
}