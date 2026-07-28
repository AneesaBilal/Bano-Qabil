import { useRef, useState } from "react";
import { File as FileIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  onFilesSelected: (files: File[]) => void;
}

export function FileUpload({ accept = ".pdf,.jpg,.jpeg,.png", multiple = true, maxSizeMb = 10, onFilesSelected }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const selected = Array.from(fileList);
    const oversized = selected.find((f) => f.size > maxSizeMb * 1024 * 1024);
    if (oversized) {
      setError(`"${oversized.name}" exceeds the ${maxSizeMb}MB limit.`);
      return;
    }
    setError(null);
    const next = multiple ? [...files, ...selected] : selected;
    setFiles(next);
    onFilesSelected(next);
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onFilesSelected(next);
  }

  return (
    <div className="space-y-2">
      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center hover:bg-accent/50"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Click to upload or drag and drop
          <br />
          <span className="text-xs">PDF or images, up to {maxSizeMb}MB each</span>
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span className="flex items-center gap-2 truncate">
                <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{file.name}</span>
              </span>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(i)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
