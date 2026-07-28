import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/shared/DataTable";
import { AttendanceStatusBadge } from "@/components/shared/StatusBadge";
import { CardGridSkeleton } from "@/components/shared/LoadingSkeleton";
import { CalendarCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAttendanceReport, summarizeAttendance } from "@/api/attendance.api";
import { listBatches, listBatchesForTeacher } from "@/api/courses.api";
import { getStudent } from "@/api/students.api";
import type { Attendance, Batch } from "@/types";
import { downloadCsv, formatDate } from "@/lib/utils";

export function AttendanceReport() {
  const { user, role } = useAuth();
  const isStaff = role === "admin" || role === "super_admin" || role === "teacher";

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [records, setRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (isStaff) {
      (role === "teacher" ? listBatchesForTeacher(user.id) : listBatches()).then(setBatches);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    (async () => {
      if (isStaff) {
        const params = selectedBatch !== "all" ? { batchId: selectedBatch } : {};
        setRecords(await getAttendanceReport(params));
      } else {
        const student = await getStudent(user.id);
        setRecords(await getAttendanceReport({ studentId: student.id }));
      }
      setIsLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isStaff, selectedBatch]);

  const summary = useMemo(() => summarizeAttendance(records), [records]);

  const columns = useMemo<ColumnDef<Attendance>[]>(
    () => [
      { id: "date", header: "Date", accessorFn: (row) => formatDate(row.date) },
      ...(isStaff
        ? ([
            {
              id: "student",
              header: "Student",
              accessorFn: (row) => row.student?.profile?.full_name ?? "",
            },
          ] as ColumnDef<Attendance>[])
        : []),
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => row.status,
        cell: ({ row }) => <AttendanceStatusBadge status={row.original.status} />,
      },
      { id: "remarks", header: "Remarks", accessorFn: (row) => row.remarks ?? "—" },
    ],
    [isStaff]
  );

  return (
    <div className="space-y-4">
      {isStaff && (
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="All batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All batches</SelectItem>
            {batches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {isLoading ? (
        <CardGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {(["present", "absent", "late", "leave"] as const).map((status) => (
            <Card key={status}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{summary[status]}</p>
                <p className="text-xs capitalize text-muted-foreground">{status}</p>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{summary.percentPresent}%</p>
              <p className="text-xs text-muted-foreground">Attendance rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      <DataTable
        columns={columns}
        data={records}
        isLoading={isLoading}
        searchPlaceholder="Search records..."
        emptyTitle="No Attendance Records"
        emptyDescription="Attendance records will appear here once students are marked present."
        emptyIcon={CalendarCheck}
        onExportCsv={() =>
          downloadCsv(
            "attendance.csv",
            records.map((r) => ({
              date: r.date,
              student: r.student?.profile?.full_name,
              status: r.status,
              remarks: r.remarks,
            }))
          )
        }
      />
    </div>
  );
}
