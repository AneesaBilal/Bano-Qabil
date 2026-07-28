import { Badge } from "@/components/ui/badge";
import type { AttendanceStatus, ApprovalStatus, SubmissionStatus } from "@/types";
import { APPROVAL_STATUS_LABELS, ATTENDANCE_STATUS_LABELS, SUBMISSION_STATUS_LABELS } from "@/lib/constants";

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const variant = status === "present" ? "success" : status === "late" ? "warning" : status === "leave" ? "secondary" : "destructive";
  return <Badge variant={variant as never}>{ATTENDANCE_STATUS_LABELS[status]}</Badge>;
}

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const variant =
    status === "graded" ? "success" : status === "submitted" ? "secondary" : status === "late" ? "warning" : "destructive";
  return <Badge variant={variant as never}>{SUBMISSION_STATUS_LABELS[status]}</Badge>;
}

export function ApprovalStatusBadge({ status }: { status: ApprovalStatus }) {
  const variant = status === "approved" ? "success" : status === "pending" ? "warning" : "destructive";
  return <Badge variant={variant as never}>{APPROVAL_STATUS_LABELS[status]}</Badge>;
}
