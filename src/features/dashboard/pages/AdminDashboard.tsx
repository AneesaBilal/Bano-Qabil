import { useEffect, useState } from "react";
import {
  Activity,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  Layers,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { CardGridSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";

import {
  getAdminDashboardStats,
  type AdminDashboardStats,
} from "@/api/dashboard.api";

import { listRecentActivity } from "@/api/activity.api";
import { countPendingApprovals } from "@/api/approvals.api";

import type { ActivityLog } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<number>(0);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAdminDashboardStats(),
      listRecentActivity(8),
      countPendingApprovals(),
    ])
      .then(([s, a, pending]) => {
        setStats(s);
        setActivity(a);
        setPendingApprovals(pending);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Institute-wide overview of students, teachers, and activity."
      />

      <Card>
  <CardHeader>
    <CardTitle className="text-lg">
      Welcome to Admin Dashboard
    </CardTitle>
  </CardHeader>

  <CardContent>
    <div className="grid gap-4 md:grid-cols-3">

      <div className="rounded-xl border bg-muted/30 p-5">
        <GraduationCap className="mb-3 h-8 w-8 text-primary" />

        <h3 className="font-semibold">
          Student Management
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Manage student profiles, batches, attendance, and academic records from one place.
        </p>
      </div>


      <div className="rounded-xl border bg-muted/30 p-5">
        <Users className="mb-3 h-8 w-8 text-primary" />

        <h3 className="font-semibold">
          Teacher Management
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Organize teachers, assignments, and classroom activities efficiently.
        </p>
      </div>


      <div className="rounded-xl border bg-muted/30 p-5">
        <BookOpen className="mb-3 h-8 w-8 text-primary" />

        <h3 className="font-semibold">
          Academic Overview
        </h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Track courses, batches, assignments, and institute performance.
        </p>
      </div>

    </div>
  </CardContent>
</Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <CardGridSkeleton count={4} />
          ) : activity.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No Recent Activity"
              description="Activity such as student registrations, attendance, assignments, approvals, and teacher actions will appear here automatically once users start using the system."
            />
          ) : (
            <ul className="space-y-3">
              {activity.map((log) => (
                <li
                  key={log.id}
                  className="flex items-start justify-between gap-4 border-b pb-3 text-sm last:border-0 last:pb-0"
                >
                  <div>
                    <span className="font-medium">
                      {log.actor?.full_name ?? "System"}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {log.action.replace(/\./g, " ").replace(/_/g, " ")}
                    </span>
                  </div>

                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDateTime(log.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}