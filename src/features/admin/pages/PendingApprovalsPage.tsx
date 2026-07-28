import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, CheckCircle2, Loader2, Search, SearchX, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { CardGridSkeleton } from "@/components/shared/LoadingSkeleton";
import { ApprovalStatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { approveUser, listApprovalRequests, rejectUser } from "@/api/approvals.api";
import type { ApprovalStatus, Profile } from "@/types";
import { formatDateTime, initials } from "@/lib/utils";

type RoleTab = "student" | "teacher";

export default function PendingApprovalsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<RoleTab>("student");
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "all">("pending");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Profile | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveTarget, setApproveTarget] = useState<Profile | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listApprovalRequests({
        role: activeTab,
        status: statusFilter,
        search: debouncedSearch || undefined,
      });
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load approval requests");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statusFilter, debouncedSearch]);

  const pendingCount = useMemo(() => profiles.filter((p) => p.approval_status === "pending").length, [profiles]);

  async function handleApprove() {
    if (!approveTarget || !user) return;
    setActioningId(approveTarget.id);
    try {
      await approveUser(approveTarget.id, user.id);
      toast.success(`${approveTarget.full_name} has been approved`);
      setApproveTarget(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve user");
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject() {
    if (!rejectTarget || !user) return;
    setActioningId(rejectTarget.id);
    try {
      await rejectUser(rejectTarget.id, user.id, rejectReason);
      toast.success(`${rejectTarget.full_name} has been rejected`);
      setRejectTarget(null);
      setRejectReason("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject user");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Approvals"
        description="Review and approve new Student and Teacher registrations before they can sign in."
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RoleTab)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="student">Pending Students</TabsTrigger>
            <TabsTrigger value="teacher">Pending Teachers</TabsTrigger>
          </TabsList>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search name, email, phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ApprovalStatus | "all")}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="all">All statuses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <CardGridSkeleton count={4} />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : profiles.length === 0 ? (
            <EmptyState
              icon={statusFilter === "pending" ? CheckCircle2 : SearchX}
              title={statusFilter === "pending" ? "No Pending Approvals" : "No requests found"}
              description={
                statusFilter === "pending"
                  ? "Everything is up to date."
                  : debouncedSearch
                    ? "Try another keyword or clear your filters."
                    : "Try a different status filter."
              }
            />
          ) : (
            <div className="space-y-3">
              {statusFilter === "pending" && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{pendingCount}</span> awaiting review
                </p>
              )}
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={p.avatar_url ?? undefined} />
                      <AvatarFallback>{initials(p.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{p.full_name}</p>
                        <ApprovalStatusBadge status={p.approval_status} />
                      </div>
                      <p className="text-sm text-muted-foreground">{p.email}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {p.phone && <span>{p.phone}</span>}
                        <span>Registered {formatDateTime(p.created_at)}</span>
                        <Badge variant="outline" className="capitalize">
                          {p.role}
                        </Badge>
                      </div>
                      {p.approval_status === "rejected" && p.rejection_reason && (
                        <p className="mt-1 text-xs text-destructive">Reason: {p.rejection_reason}</p>
                      )}
                    </div>
                  </div>

                  {p.approval_status === "pending" && (
                    <div className="flex gap-2 sm:shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive/40 text-destructive hover:bg-destructive/10"
                        disabled={actioningId === p.id}
                        onClick={() => setRejectTarget(p)}
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                      <Button size="sm" disabled={actioningId === p.id} onClick={() => setApproveTarget(p)}>
                        {actioningId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!approveTarget}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title="Approve this registration?"
        description={`${approveTarget?.full_name} will immediately be able to sign in.`}
        confirmLabel="Approve"
        onConfirm={handleApprove}
      />

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejectTarget?.full_name}&apos;s registration?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              They won&apos;t be able to sign in. You can optionally include a reason — it will be shown to them.
            </p>
            <Textarea
              placeholder="Reason (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={actioningId === rejectTarget?.id}>
              {actioningId === rejectTarget?.id && <Loader2 className="h-4 w-4 animate-spin" />}
              Reject registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
