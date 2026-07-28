import { BatchComboBox } from "@/components/shared/BatchComboBox";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditableSelect } from "@/components/shared/EditableSelect";
import { studentSchema, type StudentFormValues } from "@/features/students/schemas";
import { createStudent, updateStudent } from "@/api/students.api";
import { createCourse, listBatches, listCourses } from "@/api/courses.api";
import type { Batch, Course, Student } from "@/types";
import { generateCourseCode } from "@/lib/utils";

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onSuccess: () => void;
}

export function StudentFormDialog({ open, onOpenChange, student, onSuccess }: StudentFormDialogProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      application_id: "",
      father_name: "",
      address: "",
      course_id: undefined,
      batch_id: undefined,
      enrollment_date: new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    if (!open) return;
    listCourses().then(setCourses);
    listBatches().then(setBatches);
    if (student) {
      form.reset({
        full_name: student.profile?.full_name ?? "",
        email: student.profile?.email ?? "",
        phone: student.profile?.phone ?? "",
        application_id: student.application_id,
        father_name: student.father_name ?? "",
        address: student.address ?? "",
        course_id: student.course_id ?? undefined,
        batch_id: student.batch_id ?? undefined,
        enrollment_date: student.enrollment_date,
      });
    } else {
      form.reset({
        full_name: "",
        email: "",
        phone: "",
        application_id: "",
        father_name: "",
        address: "",
        course_id: undefined,
        batch_id: undefined,
        enrollment_date: new Date().toISOString().slice(0, 10),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, student]);

  const selectedCourseId = form.watch("course_id");
  const filteredBatches = selectedCourseId ? batches.filter((b) => b.course_id === selectedCourseId) : batches;

  async function onSubmit(values: StudentFormValues) {
    setIsSubmitting(true);
    try {
      if (student) {
        await updateStudent(student.id, values);
        toast.success("Student updated");
      } else {
        await createStudent(values);
        toast.success("Student created. A password-setup email has been sent.");
      }
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save student");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{student ? "Edit Student" : "Add Student"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" disabled={!!student} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="application_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="father_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father&apos;s name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="course_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <FormControl>
                      <EditableSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        options={courses.map((c) => ({ value: c.id, label: c.name }))}
                        placeholder="Select or type a course"
                        emptyMessage="No courses yet — type a name to add one"
                        onCreateOption={async (name) => {
                          const newCourse = await createCourse({
                            name,
                            code: generateCourseCode(name),
                            description: null,
                            duration_months: null,
                          });
                          setCourses((prev) => [...prev, newCourse]);
                          return { value: newCourse.id, label: newCourse.name };
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
             <FormField
  control={form.control}
  name="batch_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Batch</FormLabel>

      <FormControl>
        <BatchComboBox
          batches={filteredBatches}
          courses={courses}
          value={field.value ?? ""}
          onValueChange={field.onChange}
          onBatchCreated={(batch) => {
            setBatches((prev) => [...prev, batch]);
          }}
          placeholder="Select or type a batch"
        />
      </FormControl>

      <FormMessage />
    </FormItem>
  )}
/>
              <FormField
                control={form.control}
                name="enrollment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enrollment date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {student ? "Save changes" : "Create student"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
