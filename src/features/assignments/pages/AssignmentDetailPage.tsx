import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Download, FileText, Loader2, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SubmissionStatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteAssignment,
  getAssignment,
  getSignedAssignmentUrl,
  getSignedSubmissionUrl,
  getSubmission,
  gradeSubmission,
  listSubmissionsForAssignment,
} from "@/api/assignments.api";
import type { Assignment, AssignmentSubmission } from "@/types";
import { formatDateTime, initials } from "@/lib/utils";
import { SubmissionForm } from "@/features/assignments/components/SubmissionForm";
import { AssignmentFormDialog } from "@/features/assignments/components/AssignmentFormDialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const { user, role } = useAuth();
  const isStaff = role === "admin" || role === "super_admin" || role === "teacher";

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function load() {
    if (!id || !user) return;
    setIsLoading(true);
    setError(null);
    try {
      const a = await getAssignment(id);
      setAssignment(a);
      if (isStaff) {
        setSubmissions(await listSubmissionsForAssignment(id));
      } else {
        setSubmission(await getSubmission(id, user.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assignment");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  async function handleDownload(path: string) {
    try {
      const url = await getSignedAssignmentUrl(path);
      window.open(url, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open file");
    }
  }

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!assignment) return <ErrorState title="Assignment not found" />;

  const isOverdue = new Date(assignment.due_date) < new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        title={assignment.title}
        description={`${assignment.batch?.name ?? ""} · Due ${formatDateTime(assignment.due_date)}`}
        actions={
          isStaff && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )
        }
      />

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <Badge variant={isOverdue ? "destructive" : "outline"}>{isOverdue ? "Overdue" : "Open"}</Badge>
            <Badge variant="secondary">Max marks: {assignment.max_marks}</Badge>
          </div>
          {assignment.description && <p className="text-sm text-muted-foreground">{assignment.description}</p>}
          {assignment.attachment_paths?.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Attachments</p>
              <div className="space-y-2">
                {assignment.attachment_paths.map((path) => (
                  <button
                    key={path}
                    onClick={() => handleDownload(path)}
                    className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {path.split("/").pop()}
                    </span>
                    <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!isStaff && user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Submission</CardTitle>
          </CardHeader>
          <CardContent>
            {submission ? (
              <StudentSubmissionSummary submission={submission} isOverdue={isOverdue} />
            ) : (
              <SubmissionForm assignmentId={assignment.id} studentId={user.id} onSubmitted={load} />
            )}
          </CardContent>
        </Card>
      )}

      {isStaff && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submissions ({submissions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <EmptyState title="No submissions yet" description="Submissions will appear here as students turn in their work." />
            ) : (
              <div className="space-y-3">
                {submissions.map((s) => (
                  <SubmissionRow key={s.id} submission={s} onGraded={load} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isStaff && (
        <AssignmentFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          assignment={assignment}
          onSuccess={() => {
            setEditOpen(false);
            load();
          }}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this assignment?"
        description="This will remove the assignment and all student submissions."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await deleteAssignment(assignment.id);
          toast.success("Assignment deleted");
          window.history.back();
        }}
      />
    </div>
  );
}

function StudentSubmissionSummary({ submission, isOverdue }: { submission: AssignmentSubmission; isOverdue: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <SubmissionStatusBadge status={submission.status} />
        {submission.is_late && <Badge variant="destructive">Late Submission</Badge>}
        {!submission.is_late && isOverdue === false && submission.submitted_at && (
          <span className="text-xs text-muted-foreground">Submitted {formatDateTime(submission.submitted_at)}</span>
        )}
      </div>
      {submission.remarks && <p className="text-sm text-muted-foreground">Your remarks: {submission.remarks}</p>}
      {submission.grade !== null && (
        <div className="rounded-md border bg-success/5 p-3 text-sm">
          <p className="font-medium">Grade: {submission.grade}</p>
          {submission.teacher_feedback && <p className="mt-1 text-muted-foreground">{submission.teacher_feedback}</p>}
        </div>
      )}
      <div className="space-y-1">
        {submission.file_paths.map((path) => (
          <p key={path} className="text-xs text-muted-foreground">
            📎 {path.split("/").pop()}
          </p>
        ))}
      </div>
    </div>
  );
}

function SubmissionRow({ submission, onGraded }: { submission: AssignmentSubmission; onGraded: () => void }) {
  const [grade, setGrade] = useState(submission.grade?.toString() ?? "");
  const [feedback, setFeedback] = useState(submission.teacher_feedback ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleSave() {
    if (!grade) {
      toast.error("Enter a grade");
      return;
    }
    setIsSaving(true);
    try {
      await gradeSubmission(submission.id, Number(grade), feedback);
      toast.success("Grade saved");
      onGraded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save grade");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleOpenFile(path: string) {
    try {
      const url = await getSignedSubmissionUrl(path);
      window.open(url, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open file");
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <button className="flex w-full items-center justify-between text-left" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials(submission.student?.profile?.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{submission.student?.profile?.full_name}</p>
            <p className="text-xs text-muted-foreground">{submission.student?.application_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SubmissionStatusBadge status={submission.status} />
          {submission.grade !== null && <Badge variant="outline">{submission.grade} pts</Badge>}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 border-t pt-4">
          {submission.remarks && <p className="text-sm text-muted-foreground">Remarks: {submission.remarks}</p>}
          <div className="space-y-1">
            {submission.file_paths.length === 0 ? (
              <p className="text-xs text-muted-foreground">No files submitted</p>
            ) : (
              submission.file_paths.map((path) => (
                <button
                  key={path}
                  onClick={() => handleOpenFile(path)}
                  className="flex items-center gap-2 text-xs text-primary hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {path.split("/").pop()}
                </button>
              ))
            )}
          </div>
          <div className="flex items-end gap-2">
            <div className="w-24">
              <p className="mb-1 text-xs font-medium">Grade</p>
              <Input type="number" value={grade} onChange={(e) => setGrade(e.target.value)} />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-xs font-medium">Feedback</p>
              <Textarea rows={1} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            </div>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
