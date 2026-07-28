import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { CardGridSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { useAuth } from "@/hooks/useAuth";
import { listAssignments } from "@/api/assignments.api";
import { listBatchesForTeacher } from "@/api/courses.api";
import { getStudent } from "@/api/students.api";
import type { Assignment } from "@/types";
import { formatDate } from "@/lib/utils";
import { AssignmentFormDialog } from "@/features/assignments/components/AssignmentFormDialog";

export default function AssignmentsListPage() {
  const { user, role } = useAuth();
  const canCreate = role === "admin" || role === "super_admin" || role === "teacher";
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  async function load() {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      if (role === "student") {
        const student = await getStudent(user.id);
        setAssignments(student.batch_id ? await listAssignments({ batchId: student.batch_id }) : []);
      } else if (role === "teacher") {
        const batches = await listBatchesForTeacher(user.id);
        const results = await Promise.all(batches.map((b) => listAssignments({ batchId: b.id })));
        setAssignments(results.flat());
      } else {
        setAssignments(await listAssignments());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assignments");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description={role === "student" ? "View and submit your assignments." : "Create and manage assignments for your batches."}
        actions={
          canCreate && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              New Assignment
            </Button>
          )
        }
      />

      {isLoading ? (
        <CardGridSkeleton count={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No Assignments Yet"
          description={canCreate ? "Create your first assignment for a batch." : "Your teacher hasn't posted any assignments yet."}
          actionLabel={canCreate ? "New Assignment" : undefined}
          onAction={canCreate ? () => setFormOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((a) => {
            const overdue = new Date(a.due_date) < new Date();
            return (
              <Link key={a.id} to={`/assignments/${a.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{a.title}</p>
                      <Badge variant={overdue ? "destructive" : "outline"}>{overdue ? "Overdue" : "Open"}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{a.batch?.name}</span>
                      <span>Due {formatDate(a.due_date)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {canCreate && (
        <AssignmentFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          assignment={null}
          onSuccess={() => {
            setFormOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
