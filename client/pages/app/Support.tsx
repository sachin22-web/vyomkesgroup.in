import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { MessageSquare, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"; // Import icons
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton component
import { Img } from "@/components/Img"; // Import the Img component
import { Seo } from "@/components/Seo"; // Import Seo component

interface UserSupportTicket {
  id: string;
  subject: string;
  message: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export default function Support() {
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("normal");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState<string | null>(null); // Renamed from 'error' to avoid confusion
  const [submitting, setSubmitting] = useState(false);

  const [userTickets, setUserTickets] = useState<UserSupportTicket[]>([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all"); // Changed default from "" to "all"
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null); // New state for API errors
  const ticketsPerPage = 5;

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") p.set("status", statusFilter); // Only set status if not "all"
    p.set("page", String(currentPage));
    p.set("limit", String(ticketsPerPage));
    return p.toString();
  }, [statusFilter, currentPage]);

  const fetchUserTickets = async () => {
    setLoadingTickets(true);
    setApiError(null); // Clear previous API errors
    try {
      const data = await api<{ items: UserSupportTicket[]; total: number }>(
        `/api/app/support/tickets?${params}`
      );
      setUserTickets(data.items);
      setTotalTickets(data.total);
    } catch (e: any) {
      console.error("Error fetching user support tickets:", e);
      const errorMessage = e?.message || "Failed to load your support tickets.";
      toast.error(errorMessage);
      setApiError(errorMessage); // Set API error state
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchUserTickets();
  }, [params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null); // Clear form errors
    if (!subject.trim() || !message.trim()) {
      setFormError("Subject and message are required");
      return;
    }
    setSubmitting(true);
    try {
      await api("/api/app/support/tickets", {
        method: "POST",
        body: JSON.stringify({ subject, message, priority }),
      });
      toast.success("Support ticket created successfully!");
      setSubject("");
      setMessage("");
      setPriority("normal");
      fetchUserTickets(); // Refresh tickets after creating a new one
    } catch (e: any) {
      const errorMessage = e?.message || "Failed to create support ticket.";
      setFormError(errorMessage); // Set form error
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <MessageSquare className="h-4 w-4 text-blue-500" aria-hidden="true" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-orange-500" aria-hidden="true" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />;
      case "closed":
        return <XCircle className="h-4 w-4 text-gray-500" aria-hidden="true" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" aria-hidden="true" />;
    }
  };

  return (
    <>
      <Seo title="Support" description="Create and manage your support tickets." />
      <div className="grid gap-6">
        <h1 className="text-2xl font-semibold">Support</h1> {/* Changed to h1 */}

        <Img
          src="/images/customer_support.jpg" // Customer support
          alt="Customer support desk with headset icon"
          className="w-full h-48 object-cover rounded-xl border"
        />

        <Card>
          <CardHeader>
            <CardTitle>Create New Support Ticket</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <h2 className="text-sm text-muted-foreground mb-3">
              Create a support request. Our team will get back to you shortly.
            </h2> {/* Changed to h2 */}
            <form onSubmit={submit} className="grid gap-4 max-w-2xl">
              <div className="grid md:grid-cols-4 items-center gap-2">
                <Label htmlFor="subject" className="md:col-span-1">
                  Subject
                </Label>
                <Input
                  id="subject"
                  className="md:col-span-3"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  placeholder="Briefly describe your issue"
                />
              </div>
              <div className="grid md:grid-cols-4 items-center gap-2">
                <Label className="md:col-span-1">Priority</Label>
                <div className="md:col-span-3">
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
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
              <div className="grid md:grid-cols-4 items-start gap-2">
                <Label htmlFor="message" className="md:col-span-1">
                  Message
                </Label>
                <Textarea
                  id="message"
                  className="md:col-span-3 w-full min-h-[140px] rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  placeholder="Provide detailed information about your request"
                />
              </div>
              {formError && <div className="text-destructive text-sm text-center">{formError}</div>}
              <div className="flex justify-end mt-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Ticket"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Support Tickets</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex justify-end mb-4">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setCurrentPage(1);
                  setStatusFilter(v);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem> {/* Changed value from "" to "all" */}
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {apiError && (
              <div className="text-destructive text-center py-4 mb-4 border rounded-md bg-red-50">
                {apiError}
              </div>
            )}

            {loadingTickets && (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}

            {!loadingTickets && userTickets.length === 0 && !apiError && (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4" aria-hidden="true" />
                <p>You haven't submitted any support tickets yet.</p>
              </div>
            )}

            {!loadingTickets && userTickets.length > 0 && (
              <div className="space-y-4">
                {userTickets.map((ticket) => (
                  <Card key={ticket.id} className="border-l-4 border-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{ticket.subject}</h3> {/* Changed to h3 */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getStatusIcon(ticket.status)}
                          <span className="capitalize">{ticket.status.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{ticket.message}</p>
                      {ticket.adminNotes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                          <p className="font-medium text-blue-800">Admin Response:</p>
                          <p className="text-sm text-blue-700">{ticket.adminNotes}</p>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs text-muted-foreground mt-3 pt-3 border-t">
                        <span>Priority: <span className="capitalize">{ticket.priority}</span></span>
                        <span>Submitted: {new Date(ticket.createdAt).toLocaleString()}</span>
                        {ticket.resolvedAt && (
                          <span>Resolved: {new Date(ticket.resolvedAt).toLocaleString()}</span>
                        )}
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
      </div>
    </>
  );
}