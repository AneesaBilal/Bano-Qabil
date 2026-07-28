import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { GraduationCap, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { useAuth } from "@/hooks/useAuth";
import { listStudents } from "@/api/students.api";
import type { Student } from "@/types";
import { downloadCsv, formatDate, initials } from "@/lib/utils";
import { StudentFormDialog } from "@/features/students/components/StudentFormDialog";

export default function StudentsListPage() {
  const { role } = useAuth();
  const canManage = role === "admin" || role === "super_admin";
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await listStudents({ pageSize: 200 });
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo<ColumnDef<Student>[]>(
    () => [
      {
        id: "name",
        header: "Student",
        accessorFn: (row) => row.profile?.full_name ?? "",
        cell: ({ row }) => (
          <Link to={`/students/${row.original.id}`} className="flex items-center gap-3 hover:underline">
            <Avatar className="h-8 w-8">
              <AvatarImage src={row.original.profile?.avatar_url ?? undefined} />
              <AvatarFallback>{initials(row.original.profile?.full_name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{row.original.profile?.full_name}</p>
              <p className="text-xs text-muted-foreground">{row.original.application_id}</p>
            </div>
          </Link>
        ),
      },
      { id: "email", header: "Email", accessorFn: (row) => row.profile?.email ?? "" },
      {
        id: "course",
        header: "Course",
        accessorFn: (row) => row.course?.name ?? "—",
        cell: ({ getValue }) => <Badge variant="outline">{getValue<string>()}</Badge>,
      },
      { id: "batch", header: "Batch", accessorFn: (row) => row.batch?.name ?? "—" },
      { id: "enrolled", header: "Enrolled", accessorFn: (row) => formatDate(row.enrollment_date) },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => row.is_active,
        cell: ({ getValue }) => <Badge variant={getValue<boolean>() ? "success" : "secondary"}>{getValue<boolean>() ? "Active" : "Inactive"}</Badge>,
      },
      ...(canManage
        ? ([
            {
              id: "actions",
              header: "",
              cell: ({ row }) => (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setEditing(row.original);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              ),
            },
          ] as ColumnDef<Student>[])
        : []),
    ],
    [canManage]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Manage student profiles, courses, and batch assignments."
        actions={
          canManage && (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Student
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={students}
        isLoading={isLoading}
        error={error}
        onRetry={load}
        searchPlaceholder="Search students..."
        emptyTitle="No Students Found"
        emptyDescription="Start by adding your first student."
        emptyIcon={GraduationCap}
        emptyActionLabel={canManage ? "Add Student" : undefined}
        onEmptyAction={
          canManage
            ? () => {
                setEditing(null);
                setFormOpen(true);
              }
            : undefined
        }
        onExportCsv={() =>
          downloadCsv(
            "students.csv",
            students.map((s) => ({
              name: s.profile?.full_name,
              email: s.profile?.email,
              application_id: s.application_id,
              course: s.course?.name,
              batch: s.batch?.name,
              enrollment_date: s.enrollment_date,
              status: s.is_active ? "Active" : "Inactive",
            }))
          )
        }
      />

      {canManage && (
        <StudentFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          student={editing}
          onSuccess={() => {
            setFormOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
