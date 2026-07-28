import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardGridSkeleton } from "@/components/shared/LoadingSkeleton";
import { BatchComboBox } from "@/components/shared/BatchComboBox";
import { useAuth } from "@/hooks/useAuth";
import { listBatches, listBatchesForTeacher, listCourses } from "@/api/courses.api";
import { listStudents } from "@/api/students.api";
import { getAttendanceForBatchDate, markAttendance, type MarkAttendanceEntry } from "@/api/attendance.api";
import type { AttendanceStatus, Batch, Course, Student } from "@/types";
import { ATTENDANCE_STATUS_LABELS } from "@/lib/constants";
import { cn, initials } from "@/lib/utils";

const STATUS_OPTIONS: AttendanceStatus[] = ["present", "absent", "late", "leave"];

export default function AttendanceMarkPage() {
  const { user, role } = useAuth();
  const isStaff = role === "admin" || role === "super_admin" || role === "teacher";

  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<Student[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user || !isStaff) return;
    (role === "teacher" ? listBatchesForTeacher(user.id) : listBatches()).then((b) => {
      setBatches(b);
      if (b.length > 0) setSelectedBatch(b[0].id);
    });
    listCourses().then(setCourses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

  useEffect(() => {
    if (!selectedBatch) return;
    setIsLoading(true);
    Promise.all([listStudents({ batchId: selectedBatch, pageSize: 200 }), getAttendanceForBatchDate(selectedBatch, date)])
      .then(([{ data: studentList }, existing]) => {
        setStudents(studentList);
        const map: Record<string, AttendanceStatus> = {};
        studentList.forEach((s) => {
          map[s.id] = "present";
        });
        existing.forEach((a) => {
          map[a.student_id] = a.status;
        });
        setStatuses(map);
      })
      .finally(() => setIsLoading(false));
  }, [selectedBatch, date]);

  async function handleSave() {
    if (!selectedBatch) return;
    setIsSaving(true);
    try {
      const entries: MarkAttendanceEntry[] = students.map((s) => ({ student_id: s.id, status: statuses[s.id] ?? "present" }));
      await markAttendance(selectedBatch, date, entries);
      toast.success("Attendance saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save attendance");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isStaff) {
    return <EmptyState title="Not available" description="Only teachers and admins can mark attendance." />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <BatchComboBox
              batches={batches}
              courses={courses}
              value={selectedBatch}
              onValueChange={setSelectedBatch}
              onBatchCreated={(newBatch) => setBatches((prev) => [...prev, newBatch])}
              placeholder="Select or type a batch"
              className="w-full sm:w-64"
            />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full sm:w-40" />
          </div>
          <Button onClick={handleSave} disabled={isSaving || students.length === 0}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Attendance
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CardGridSkeleton count={4} />
          ) : students.length === 0 ? (
            <EmptyState title="No students in this batch" description="Enroll students into this batch to mark attendance." />
          ) : (
            <div className="space-y-2">
              {students.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials(s.profile?.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{s.profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{s.application_id}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {STATUS_OPTIONS.map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatuses((prev) => ({ ...prev, [s.id]: status }))}
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                          statuses[s.id] === status
                            ? status === "present"
                              ? "border-success bg-success text-success-foreground"
                              : status === "late"
                                ? "border-warning bg-warning text-warning-foreground"
                                : status === "leave"
                                  ? "border-secondary bg-secondary text-secondary-foreground"
                                  : "border-destructive bg-destructive text-destructive-foreground"
                            : "text-muted-foreground hover:bg-accent"
                        )}
                      >
                        {ATTENDANCE_STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
