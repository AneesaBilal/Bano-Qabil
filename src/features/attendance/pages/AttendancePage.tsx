import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import AttendanceMarkPage from "@/features/attendance/pages/AttendanceMarkPage";
import { AttendanceReport } from "@/features/attendance/pages/AttendanceReport";

/** Entry point for /attendance — staff get Mark + Reports tabs, students see their own report. */
export default function AttendancePage() {
  const { role } = useAuth();
  const isStaff = role === "admin" || role === "super_admin" || role === "teacher";

  if (!isStaff) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Attendance" description="Your attendance history and summary." />
        <AttendanceReport />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Mark attendance and review reports." />
      <Tabs defaultValue="mark">
        <TabsList>
          <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="mark">
          <AttendanceMarkPage />
        </TabsContent>
        <TabsContent value="reports">
          <AttendanceReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
