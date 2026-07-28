import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layers, Loader2, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditableSelect } from "@/components/shared/EditableSelect";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { CardGridSkeleton } from "@/components/shared/LoadingSkeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  assignTeacherToBatch,
  createBatch,
  createCourse,
  deleteBatch,
  listBatches,
  listCourses,
  unassignTeacherFromBatch,
  updateBatch,
} from "@/api/courses.api";
import { listTeachers } from "@/api/teachers.api";
import { supabase } from "@/lib/supabase";
import type { Batch, Course, Teacher } from "@/types";
import { generateCourseCode } from "@/lib/utils";

const batchSchema = z.object({
  course_id: z.string().min(1, "Select a course"),
  name: z.string().min(1, "Batch name is required"),
  timing: z.string().min(1, "Timing is required"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});
type BatchFormValues = z.infer<typeof batchSchema>;

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignedByBatch, setAssignedByBatch] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Batch | null>(null);
  const [deleting, setDeleting] = useState<Batch | null>(null);
  const [assigning, setAssigning] = useState<Batch | null>(null);

  async function load() {
    setIsLoading(true);
    try {
      const [b, c, t, links] = await Promise.all([
        listBatches(),
        listCourses(),
        listTeachers(),
        supabase.from("teacher_batches").select("teacher_id, batch_id"),
      ]);
      setBatches(b);
      setCourses(c);
      setTeachers(t);
      const map: Record<string, string[]> = {};
      (links.data ?? []).forEach((row) => {
        map[row.batch_id] = [...(map[row.batch_id] ?? []), row.teacher_id];
      });
      setAssignedByBatch(map);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: { course_id: "", name: "", timing: "", start_date: "", end_date: "" },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ course_id: "", name: "", timing: "", start_date: "", end_date: "" });
    setFormOpen(true);
  }

  function openEdit(batch: Batch) {
    setEditing(batch);
    form.reset({
      course_id: batch.course_id,
      name: batch.name,
      timing: batch.timing,
      start_date: batch.start_date ?? "",
      end_date: batch.end_date ?? "",
    });
    setFormOpen(true);
  }

  async function onSubmit(values: BatchFormValues) {
    try {
      if (editing) {
        await updateBatch(editing.id, values);
        toast.success("Batch updated");
      } else {
        await createBatch(values);
        toast.success("Batch created");
      }
      setFormOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save batch");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteBatch(deleting.id);
      toast.success("Batch deleted");
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete batch");
    }
  }

  async function toggleTeacher(batchId: string, teacherId: string, checked: boolean) {
    try {
      if (checked) await assignTeacherToBatch(teacherId, batchId);
      else await unassignTeacherFromBatch(teacherId, batchId);
      setAssignedByBatch((prev) => ({
        ...prev,
        [batchId]: checked ? [...(prev[batchId] ?? []), teacherId] : (prev[batchId] ?? []).filter((id) => id !== teacherId),
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update assignment");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches"
        description="Manage batches, timings, and teacher assignments."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add Batch
          </Button>
        }
      />

      {isLoading ? (
        <CardGridSkeleton count={4} />
      ) : batches.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Batches Yet"
          description="Create a batch to start enrolling students."
          actionLabel="Add Batch"
          onAction={openCreate}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <Card key={batch.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{batch.name}</p>
                    <Badge variant="outline" className="mt-1">
                      {batch.course?.name}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAssigning(batch)}>
                      <UserPlus className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(batch)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleting(batch)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{batch.timing}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(assignedByBatch[batch.id] ?? []).length} teacher(s) assigned
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Batch" : "Add Batch"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Morning Batch A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timing"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timing</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Mon-Fri 6:00 PM - 8:00 PM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? "Save changes" : "Create batch"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assigning} onOpenChange={(open) => !open && setAssigning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Teachers — {assigning?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {teachers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teachers available. Add a teacher first.</p>
            ) : (
              teachers.map((t) => (
                <label key={t.id} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                  <Checkbox
                    checked={assigning ? (assignedByBatch[assigning.id] ?? []).includes(t.id) : false}
                    onCheckedChange={(checked) => assigning && toggleTeacher(assigning.id, t.id, !!checked)}
                  />
                  <span>
                    {t.profile?.full_name} <span className="text-muted-foreground">({t.specialization ?? "General"})</span>
                  </span>
                </label>
              ))
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setAssigning(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this batch?"
        description={`"${deleting?.name}" will be permanently removed along with its attendance and assignment records.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
