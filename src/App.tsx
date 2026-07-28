import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { ROUTES } from "@/lib/constants";

import LandingPage from "@/features/landing/pages/LandingPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import SignupPage from "@/features/auth/pages/SignupPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";

import DashboardRouter from "@/features/dashboard/pages/DashboardRouter";
import StudentsListPage from "@/features/students/pages/StudentsListPage";
import StudentProfilePage from "@/features/students/pages/StudentProfilePage";
import TeachersListPage from "@/features/admin/pages/TeachersListPage";
import CoursesPage from "@/features/admin/pages/CoursesPage";
import BatchesPage from "@/features/admin/pages/BatchesPage";
import ReportsPage from "@/features/admin/pages/ReportsPage";
import ManageUsersPage from "@/features/admin/pages/ManageUsersPage";
import PendingApprovalsPage from "@/features/admin/pages/PendingApprovalsPage";
import AssignmentsListPage from "@/features/assignments/pages/AssignmentsListPage";
import AssignmentDetailPage from "@/features/assignments/pages/AssignmentDetailPage";
import AttendancePage from "@/features/attendance/pages/AttendancePage";
import SettingsPage from "@/features/settings/pages/SettingsPage";
import NotFoundPage from "@/routes/pages/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider delayDuration={200}>
        <Routes>
          {/* Public marketing + auth routes */}
          <Route path={ROUTES.landing} element={<LandingPage />} />
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.signup} element={<SignupPage />} />
          <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />

          {/* Authenticated app shell */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path={ROUTES.dashboard} element={<DashboardRouter />} />

            <Route
              path={ROUTES.students}
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin", "teacher"]}>
                  <StudentsListPage />
                </ProtectedRoute>
              }
            />
            <Route path="/students/:id" element={<StudentProfilePage />} />

            <Route
              path={ROUTES.teachers}
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <TeachersListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.courses}
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <CoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.batches}
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <BatchesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <ManageUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.approvals}
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <PendingApprovalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.reports}
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            <Route path={ROUTES.assignments} element={<AssignmentsListPage />} />
            <Route path="/assignments/:id" element={<AssignmentDetailPage />} />

            <Route path={ROUTES.attendance} element={<AttendancePage />} />

            <Route path={ROUTES.settings} element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </TooltipProvider>
    </BrowserRouter>
  );
}
