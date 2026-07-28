import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EditableSelect, type EditableSelectOption } from "@/components/shared/EditableSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createBatch } from "@/api/courses.api";
import type { Batch, Course } from "@/types";

interface BatchComboBoxProps {
  batches: Batch[];
  courses: Course[];
  value: string;
  onValueChange: (batchId: string) => void;
  onBatchCreated?: (batch: Batch) => void;
  placeholder?: string;
  className?: string;
}

interface PendingCreate {
  name: string;
  resolve: (option: EditableSelectOption) => void;
  reject: () => void;
}

/**
 * Batch dropdown that behaves like a searchable combobox: pick an existing
 * batch, or type a name that doesn't exist yet and add it on the spot. A
 * batch also needs a course + timing, so "add" opens a two-field dialog
 * right here (no navigating away) before the new batch is created and
 * immediately selected.
 */
export function BatchComboBox({ batches, courses, value, onValueChange, onBatchCreated, placeholder = "Select or type a batch", className }: BatchComboBoxProps) {
  const [pending, setPending] = useState<PendingCreate | null>(null);
  const [courseId, setCourseId] = useState("");
  const [timing, setTiming] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  function requestCreate(name: string): Promise<EditableSelectOption> {
    return new Promise((resolve, reject) => {
      setCourseId("");
      setTiming("");
      setPending({ name, resolve, reject });
    });
  }

  function cancelCreate() {
    pending?.reject();
    setPending(null);
  }

  async function confirmCreate() {
    if (!pending) return;
    if (!courseId || !timing.trim()) {
      toast.error("Select a course and enter a timing to create this batch");
      return;
    }
    setIsCreating(true);
    try {
      const newBatch = await createBatch({
        course_id: courseId,
        name: pending.name,
        timing: timing.trim(),
        start_date: null,
        end_date: null,
      });
      onBatchCreated?.(newBatch);
      pending.resolve({ value: newBatch.id, label: newBatch.name });
      setPending(null);
      toast.success(`Batch "${newBatch.name}" created`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create batch");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <>
      <EditableSelect
        value={value}
        onValueChange={onValueChange}
        options={batches.map((b) => ({ value: b.id, label: b.course ? `${b.name} — ${b.course.name}` : b.name }))}
        placeholder={placeholder}
        searchPlaceholder="Search or type a new batch name..."
        emptyMessage="No batches yet — type a name to add one"
        onCreateOption={requestCreate}
        className={className}
      />

      <Dialog open={!!pending} onOpenChange={(open) => !open && cancelCreate()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add batch &quot;{pending?.name}&quot;</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A batch needs a course and a timing — fill these in and it'll be ready to select immediately.
            </p>
            <div>
              <p className="mb-1.5 text-sm font-medium">Course</p>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">Timing</p>
              <Input value={timing} onChange={(e) => setTiming(e.target.value)} placeholder="e.g. Mon-Fri 6:00 PM - 8:00 PM" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={cancelCreate}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create &amp; Select
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
