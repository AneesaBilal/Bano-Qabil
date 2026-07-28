import { useEffect, useState } from "react";
import { Download, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { CardGridSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { supabase } from "@/lib/supabase";
import { downloadCsv } from "@/lib/utils";
import { getAdminDashboardStats, type AdminDashboardStats } from "@/api/dashboard.api";

interface CourseEnrollment {
  [key: string]: unknown; // ✅ FIXED: Added index signature to satisfy Record<string, unknown>[]
  course_name: string;
  student_count: number;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [enrollment, setEnrollment] = useState<CourseEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [dashboardStats, students] = await Promise.all([
        getAdminDashboardStats(),
        supabase.from("students").select("course:courses(name)"),
      ]);
      setStats(dashboardStats);

      const counts = new Map<string, number>();
      (students.data ?? []).forEach((row) => {
        const name = (row.course as unknown as { name: string } | null)?.name ?? "Unassigned";
        counts.set(name, (counts.get(name) ?? 0) + 1);
      });
      setEnrollment(Array.from(counts.entries()).map(([course_name, student_count]) => ({ course_name, student_count })));
      setIsLoading(false);
    })();
  }, []);

  async function exportFullStudentReport() {
    const { data } = await supabase
      .from("students")
      .select("application_id, enrollment_date, is_active, profile:profiles(full_name, email, phone), course:courses(name), batch:batches(name)");
    downloadCsv(
      "full-student-report.csv",
      (data ?? []).map((s) => ({
        name: (s.profile as unknown as { full_name: string })?.full_name,
        email: (s.profile as unknown as { email: string })?.email,
        phone: (s.profile as unknown as { phone: string })?.phone,
        application_id: s.application_id,
        course: (s.course as unknown as { name: string } | null)?.name,
        batch: (s.batch as unknown as { name: string } | null)?.name,
        enrollment_date: s.enrollment_date,
        status: s.is_active ? "Active" : "Inactive",
      }))
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Institute-wide summaries and exports."
        actions={
          stats && (stats.totalStudents > 0 || stats.totalTeachers > 0) && (
            <Button variant="outline" onClick={exportFullStudentReport}>
              <Download className="h-4 w-4" />
              Export Full Student Report
            </Button>
          )
        }
      />

      {isLoading || !stats ? (
        <CardGridSkeleton count={4} />
      ) : stats.totalStudents === 0 && stats.totalTeachers === 0 ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="No Reports Available"
            description="Generate reports after adding data — start by adding your first student or teacher."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Total Teachers</p>
              <p className="text-2xl font-bold">{stats.totalTeachers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Assignment Submission Rate</p>
              <p className="text-2xl font-bold">
                {stats.submittedAssignments + stats.pendingAssignments > 0
                  ? Math.round((stats.submittedAssignments / (stats.submittedAssignments + stats.pendingAssignments)) * 100)
                  : 0}
                %
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Attendance Rate (30d)</p>
              <p className="text-2xl font-bold">{stats.attendanceRatePercent}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Enrollment by Course</CardTitle>
          {enrollment.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => downloadCsv("enrollment-by-course.csv", enrollment)}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CardGridSkeleton count={3} />
          ) : enrollment.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No Enrollment Data"
              description="Enrollment breakdown will appear here once students are assigned to courses."
            />
          ) : (
            <div className="space-y-2">
              {enrollment.map((row) => (
                <div key={row.course_name} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
                  <span>{row.course_name}</span>
                  <span className="font-medium">{row.student_count} students</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
