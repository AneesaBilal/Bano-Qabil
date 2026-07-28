import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/shared/FileUpload";
import { submitAssignment } from "@/api/assignments.api";

interface SubmissionFormProps {
  assignmentId: string;
  studentId: string;
  onSubmitted: () => void;
}

export function SubmissionForm({ assignmentId, studentId, onSubmitted }: SubmissionFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (files.length === 0) {
      toast.error("Please attach at least one file");
      return;
    }
    setIsSubmitting(true);
    try {
      await submitAssignment({ assignmentId, studentId, files, remarks });
      toast.success("Assignment submitted");
      onSubmitted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit assignment");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <FileUpload onFilesSelected={setFiles} />
      <div>
        <p className="mb-2 text-sm font-medium">Remarks (optional)</p>
        <Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any notes for your teacher..." />
      </div>
      <Button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit Assignment
      </Button>
    </div>
  );
}
