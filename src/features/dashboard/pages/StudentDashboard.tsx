import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, ClipboardCheck, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { CardGridSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { useAuth } from "@/hooks/useAuth";
import { getStudentDashboardStats, type StudentDashboardStats } from "@/api/dashboard.api";
import { listAssignments } from "@/api/assignments.api";
import { getStudent } from "@/api/students.api";
import type { Assignment } from "@/types";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const student = await getStudent(user.id);
        const [s, a] = await Promise.all([
          getStudentDashboardStats(user.id),
          student.batch_id ? listAssignments({ batchId: student.batch_id }) : Promise.resolve([]),
        ]);
        setStats(s);
        setAssignments(a.slice(0, 5));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className="space-y-6">
      <PageHeader title="Student Dashboard" description="Track your assignments and attendance." />

      {isLoading || !stats ? (
        <CardGridSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={ClipboardList}
            label="Pending Assignments"
            value={stats.pendingAssignments}
            iconClassName="bg-warning/10 text-warning"
            emptyHint="You're all caught up!"
          />
          <StatCard
            icon={ClipboardCheck}
            label="Submitted"
            value={stats.submittedAssignments}
            iconClassName="bg-success/10 text-success"
            emptyHint="No submissions yet."
          />
          <StatCard icon={CalendarCheck} label="Attendance" value={`${stats.attendancePercent}%`} />
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Upcoming Assignments</CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.assignments}>View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CardGridSkeleton count={3} />
          ) : assignments.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No Assignments Yet"
              description="New assignments from your teacher will appear here."
            />
          ) : (
            <ul className="space-y-3">
              {assignments.map((a) => (
                <li key={a.id} className="flex items-center justify-between border-b pb-3 text-sm last:border-0 last:pb-0">
                  <div>
                    <Link to={`${ROUTES.assignments}/${a.id}`} className="font-medium hover:underline">
                      {a.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">Due {formatDate(a.due_date)}</p>
                  </div>
                  <Badge variant="outline">{a.batch?.name}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
