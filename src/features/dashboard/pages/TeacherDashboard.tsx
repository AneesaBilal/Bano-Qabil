import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, ClipboardList, Layers, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { CardGridSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import { useAuth } from "@/hooks/useAuth";
import { getTeacherDashboardStats, type TeacherDashboardStats } from "@/api/dashboard.api";
import { listBatchesForTeacher } from "@/api/courses.api";
import type { Batch } from "@/types";
import { ROUTES } from "@/lib/constants";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getTeacherDashboardStats(user.id), listBatchesForTeacher(user.id)])
      .then(([s, b]) => {
        setStats(s);
        setBatches(b);
      })
      .finally(() => setIsLoading(false));
  }, [user]);

  return (
    <div className="space-y-6">
      <PageHeader title="Teacher Dashboard" description="Your classes, students, and assignments at a glance." />

      {isLoading || !stats ? (
        <CardGridSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Layers} label="My Classes" value={stats.totalClasses} emptyHint="No classes assigned yet." />
          <StatCard icon={Users} label="Students" value={stats.totalStudents} emptyHint="No students in your classes yet." />
          <StatCard
            icon={ClipboardList}
            label="Active Assignments"
            value={stats.activeAssignments}
            emptyHint="No assignments created yet."
            emptyActionLabel="Create Assignment"
            emptyActionTo={ROUTES.assignments}
          />
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">My Classes</CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link to={ROUTES.attendance}>
              <CalendarCheck className="h-4 w-4" />
              Mark Attendance
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CardGridSkeleton count={2} />
          ) : batches.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No Classes Assigned Yet"
              description="An admin needs to assign you to a batch before it shows up here."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {batches.map((batch) => (
                <div key={batch.id} className="rounded-lg border p-4">
                  <p className="font-medium">{batch.name}</p>
                  <p className="text-sm text-muted-foreground">{batch.course?.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{batch.timing}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
