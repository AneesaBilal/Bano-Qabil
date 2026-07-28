import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/shared/FileUpload";
import { useAuth } from "@/hooks/useAuth";
import { createAssignment, updateAssignment } from "@/api/assignments.api";
import { listBatches, listBatchesForTeacher } from "@/api/courses.api";
import { createNotificationsForBatch } from "@/api/notifications.api";
import type { Assignment, Batch } from "@/types";

const assignmentSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  batch_id: z.string().min(1, "Select a batch"),
  due_date: z.string().min(1, "Due date is required"),
  max_marks: z.coerce.number().int().positive().default(100),
});
type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface AssignmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment | null;
  onSuccess: () => void;
}

export function AssignmentFormDialog({ open, onOpenChange, assignment, onSuccess }: AssignmentFormDialogProps) {
  const { user, role } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { title: "", description: "", batch_id: "", due_date: "", max_marks: 100 },
  });

  useEffect(() => {
    if (!open || !user) return;
    (role === "teacher" ? listBatchesForTeacher(user.id) : listBatches()).then(setBatches);
    if (assignment) {
      form.reset({
        title: assignment.title,
        description: assignment.description ?? "",
        batch_id: assignment.batch_id,
        due_date: assignment.due_date.slice(0, 16),
        max_marks: assignment.max_marks ?? 100,
      });
    } else {
      form.reset({ title: "", description: "", batch_id: "", due_date: "", max_marks: 100 });
      setFiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, assignment, user, role]);

  async function onSubmit(values: AssignmentFormValues) {
    setIsSubmitting(true);
    try {
      if (assignment) {
        await updateAssignment(assignment.id, { ...values, files });
        toast.success("Assignment updated");
      } else {
        await createAssignment({ ...values, files });
        await createNotificationsForBatch(
          values.batch_id,
          "New assignment posted",
          `"${values.title}" is due ${new Date(values.due_date).toLocaleDateString()}.`,
          "assignment_created",
          "/assignments"
        );
        toast.success("Assignment created");
      }
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save assignment");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{assignment ? "Edit Assignment" : "New Assignment"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="batch_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select batch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {batches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_marks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max marks</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due date &amp; time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <p className="mb-2 text-sm font-medium">Attachments (PDF / images)</p>
              <FileUpload onFilesSelected={setFiles} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {assignment ? "Save changes" : "Create assignment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
