import { useAuth } from "@/hooks/useAuth";
import AdminDashboard from "@/features/dashboard/pages/AdminDashboard";
import TeacherDashboard from "@/features/dashboard/pages/TeacherDashboard";
import StudentDashboard from "@/features/dashboard/pages/StudentDashboard";

/** Renders the correct role-specific dashboard for the signed-in user. */
export default function DashboardRouter() {
  const { role } = useAuth();

  if (role === "super_admin" || role === "admin") return <AdminDashboard />;
  if (role === "teacher") return <TeacherDashboard />;
  return <StudentDashboard />;
}
