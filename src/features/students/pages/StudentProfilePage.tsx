import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageSkeleton } from "@/components/shared/LoadingSkeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { useAuth } from "@/hooks/useAuth";
import { getStudent, uploadAvatar } from "@/api/students.api";
import { getAttendanceReport, summarizeAttendance } from "@/api/attendance.api";
import type { Student } from "@/types";
import { formatDate, initials } from "@/lib/utils";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export default function StudentProfilePage() {
  const params = useParams();
  const { user } = useAuth();
  const studentId = params.id ?? user?.id ?? "";
  const isOwnProfile = studentId === user?.id;

  const [student, setStudent] = useState<Student | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<ReturnType<typeof summarizeAttendance> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    if (!studentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [s, attendance] = await Promise.all([getStudent(studentId), getAttendanceReport({ studentId })]);
      setStudent(s);
      setAttendanceSummary(summarizeAttendance(attendance));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !studentId) return;
    setIsUploading(true);
    try {
      await uploadAvatar(studentId, file);
      toast.success("Profile picture updated");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  }

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!student) return <ErrorState title="Student not found" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Student Profile" description="Personal and academic information." />

      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={student.profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-lg">{initials(student.profile?.full_name)}</AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <>
                <button
                  className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-semibold">{student.profile?.full_name}</h2>
            <p className="text-sm text-muted-foreground">{student.profile?.email}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge variant="outline">{student.application_id}</Badge>
              {student.course && <Badge variant="secondary">{student.course.name}</Badge>}
              <Badge variant={student.is_active ? "success" : "secondary"}>{student.is_active ? "Active" : "Inactive"}</Badge>
            </div>
          </div>
          {attendanceSummary && (
            <div className="text-center">
              <p className="text-2xl font-bold">{attendanceSummary.percentPresent}%</p>
              <p className="text-xs text-muted-foreground">Attendance</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Full name" value={student.profile?.full_name} />
          <Field label="Father's name" value={student.father_name} />
          <Field label="Email" value={student.profile?.email} />
          <Field label="Phone" value={student.profile?.phone} />
          <Field label="Application ID" value={student.application_id} />
          <Field label="Course" value={student.course?.name} />
          <Field label="Batch" value={student.batch?.name} />
          <Field label="Timing" value={student.batch?.timing} />
          <Field label="Enrollment Date" value={formatDate(student.enrollment_date)} />
          <Field label="Address" value={student.address} />
        </CardContent>
      </Card>
    </div>
  );
}
