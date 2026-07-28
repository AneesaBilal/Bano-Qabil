import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Users2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { listTeachers } from "@/api/teachers.api";
import type { Teacher } from "@/types";
import { downloadCsv, formatDate, initials } from "@/lib/utils";
import { TeacherFormDialog } from "@/features/admin/pages/TeacherFormDialog";

export default function TeachersListPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      setTeachers(await listTeachers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teachers");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo<ColumnDef<Teacher>[]>(
    () => [
      {
        id: "name",
        header: "Teacher",
        accessorFn: (row) => row.profile?.full_name ?? "",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={row.original.profile?.avatar_url ?? undefined} />
              <AvatarFallback>{initials(row.original.profile?.full_name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{row.original.profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">{row.original.employee_id ?? "—"}</p>
            </div>
          </div>
        ),
      },
      { id: "email", header: "Email", accessorFn: (row) => row.profile?.email ?? "" },
      { id: "specialization", header: "Specialization", accessorFn: (row) => row.specialization ?? "—" },
      { id: "joined", header: "Joined", accessorFn: (row) => formatDate(row.joining_date) },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => row.profile?.is_active,
        cell: ({ getValue }) => (
          <Badge variant={getValue<boolean>() ? "success" : "secondary"}>{getValue<boolean>() ? "Active" : "Inactive"}</Badge>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        description="Manage teacher accounts and batch assignments."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Teacher
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={teachers}
        isLoading={isLoading}
        error={error}
        onRetry={load}
        searchPlaceholder="Search teachers..."
        emptyTitle="No Teachers Yet"
        emptyDescription="Create your first teacher account."
        emptyIcon={Users2}
        emptyActionLabel="Add Teacher"
        onEmptyAction={() => setFormOpen(true)}
        onExportCsv={() =>
          downloadCsv(
            "teachers.csv",
            teachers.map((t) => ({
              name: t.profile?.full_name,
              email: t.profile?.email,
              employee_id: t.employee_id,
              specialization: t.specialization,
              joined: t.joining_date,
            }))
          )
        }
      />

      <TeacherFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          setFormOpen(false);
          load();
        }}
      />
    </div>
  );
}
