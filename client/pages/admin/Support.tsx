import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { MessageSquare, Clock, CheckCircle, XCircle, AlertTriangle, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label"; // Added import for Label
import { Img } from "@/components/Img"; // Import the Img component

interface AdminSupportTicket {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  subject: string;
  message: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export default function AdminSupport() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const ticketsPerPage = 10;

  // State for the edit dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTicket, setEditingTicket] = useState<AdminSupportTicket | null>(null);
  const [dialogAdminNotes, setDialogAdminNotes] = useState("");
  const [dialogStatus, setDialogStatus] = useState<AdminSupportTicket['status']>("open");
  const [dialogPriority, setDialogPriority] = useState<AdminSupportTicket['priority']>("normal");


  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") p.set("status", statusFilter);
    if (priorityFilter && priorityFilter !== "all") p.set("priority", priorityFilter);
    if (searchQuery) p.set("search", searchQuery);
    p.set("page", String(currentPage));
    p.set("limit", String(ticketsPerPage));
    return p.toString();
  }, [statusFilter, priorityFilter, searchQuery, currentPage]);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    setApiError(null);
    try {
      const data = await api<{ items: AdminSupportTicket[]; total: number }>(
        `/api/admin/support/tickets?${params}`
      );
      setTickets(data.items);
      setTotalTickets(data.total);
    } catch (e: any) {
      console.error("Error fetching admin support tickets:", e);
      const errorMessage = e?.message || "Failed to load support tickets.";
      toast.error(errorMessage);
      setApiError(errorMessage);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [params]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "closed":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "text-green-600";
      case "normal":
        return "text-blue-600";
      case "high":
        return "text-orange-600";
      case "urgent":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const openEditDialog = (ticket: AdminSupportTicket) => {
    setEditingTicket(ticket);
    setDialogAdminNotes(ticket.adminNotes || "");
    setDialogStatus(ticket.status);
    setDialogPriority(ticket.priority);
    setOpenDialog(true);
  };

  const saveTicketChanges = async () => {
    if (!editingTicket) return;

    try {
      await api(`/api/admin/support/tickets/${editingTicket.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          adminNotes: dialogAdminNotes,
          status: dialogStatus,
          priority: dialogPriority,
        }),
      });
      toast.success("Ticket updated successfully!");
      setOpenDialog(false);
      setEditingTicket(null);
      fetchTickets(); // Refresh the list
    } catch (e: any) {
      toast.error(e?.message || "Failed to update ticket.");
    }
  };

  return (
    <div className="grid gap-6">
      <div className="text-2xl font-semibold">Support Desk</div>

      <Img
        src="/images/admin_support_desk.jpg"
        alt="Admin Support Desk"
        className="w-full h-48 object-cover rounded-xl border"
      />

      <Card>
        <CardContent className="p-5 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          <Input
            placeholder="Search subject, message, notes"
            value={searchQuery}
            onChange={(e) => {
              setCurrentPage(1);
              setSearchQuery(e.target.value);
            }}
            className="md:col-span-2"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setCurrentPage(1);
              setStatusFilter(v);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter}
            onValueChange={(v) => {
              setCurrentPage(1);
              setPriorityFilter(v);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Support Tickets</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {apiError && (
            <div className="text-destructive text-center py-4 mb-4 border rounded-md bg-red-50">
              {apiError}
            </div>
          )}

          {loadingTickets && (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {!loadingTickets && tickets.length === 0 && !apiError && (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4" />
              <p>No support tickets found matching your criteria.</p>
            </div>
          )}

          {!loadingTickets && tickets.length > 0 && (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="border-l-4 border-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getStatusIcon(ticket.status)}
                        <span className="capitalize">{ticket.status.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <User className="h-4 w-4" />
                      <span>{ticket.userName || ticket.userEmail || ticket.userPhone || "N/A"}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)} bg-opacity-10`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{ticket.message}</p>
                    {ticket.adminNotes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                        <p className="font-medium text-blue-800">Admin Notes:</p>
                        <p className="text-sm text-blue-700">{ticket.adminNotes}</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-3 pt-3 border-t">
                      <span>Submitted: {new Date(ticket.createdAt).toLocaleString()}</span>
                      {ticket.resolvedAt && (
                        <span>Resolved: {new Date(ticket.resolvedAt).toLocaleString()} by {ticket.resolvedBy || "Admin"}</span>
                      )}
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(ticket)}>
                        View / Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm gap-2">
                <div>
                  Page {currentPage} / {Math.max(1, Math.ceil(totalTickets / ticketsPerPage))}
                </div>
                <div className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= Math.ceil(totalTickets / ticketsPerPage)}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={(o) => { setOpenDialog(o); if (!o) setEditingTicket(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Support Ticket</DialogTitle>
          </DialogHeader>
          {editingTicket && (
            <div className="grid gap-4 py-4">
              <div>
                <p className="text-sm text-muted-foreground">User:</p>
                <p className="font-medium">{editingTicket.userName || editingTicket.userEmail || editingTicket.userPhone || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Subject:</p>
                <p className="font-medium">{editingTicket.subject}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Message:</p>
                <p className="text-sm">{editingTicket.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dialogStatus">Status</Label>
                  <Select value={dialogStatus} onValueChange={(v) => setDialogStatus(v as any)}>
                    <SelectTrigger id="dialogStatus" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dialogPriority">Priority</Label>
                  <Select value={dialogPriority} onValueChange={(v) => setDialogPriority(v as any)}>
                    <SelectTrigger id="dialogPriority" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="dialogAdminNotes">Admin Notes</Label>
                <Textarea
                  id="dialogAdminNotes"
                  value={dialogAdminNotes}
                  onChange={(e) => setDialogAdminNotes(e.target.value)}
                  rows={5}
                  className="mt-1"
                  placeholder="Add internal notes or resolution details"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveTicketChanges}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}