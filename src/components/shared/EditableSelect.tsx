import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface EditableSelectOption {
  value: string;
  label: string;
}

interface EditableSelectProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: EditableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  /**
   * Called when the user picks "Add '<value>'" for text that doesn't match
   * any existing option. Return the option that should end up selected —
   * e.g. create the row in the database and return its id + name.
   * If omitted, the typed text itself is used as both the value and label
   * (plain free-text mode — use this when the field isn't a foreign key).
   */
  onCreateOption?: (inputValue: string) => Promise<EditableSelectOption> | EditableSelectOption;
  disabled?: boolean;
  className?: string;
}

/**
 * A dropdown that behaves like a normal select (pick an existing option) but
 * also lets the user type a value that doesn't exist yet and add it on the
 * fly — the newly typed value then behaves exactly like a selected option.
 */
export function EditableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select or type...",
  searchPlaceholder = "Search or type to add...",
  emptyMessage = "No matching options",
  onCreateOption,
  disabled,
  className,
}: EditableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  // Options created in this session get merged in immediately so the label
  // renders correctly even before the parent's `options` list refreshes.
  const [localOptions, setLocalOptions] = useState<EditableSelectOption[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const allOptions = useMemo(() => {
    const merged = [...options];
    for (const opt of localOptions) {
      if (!merged.some((o) => o.value === opt.value)) merged.push(opt);
    }
    return merged;
  }, [options, localOptions]);

  const selectedLabel = allOptions.find((o) => o.value === value)?.label ?? "";

  const filtered = useMemo(() => {
    if (!query.trim()) return allOptions;
    const q = query.trim().toLowerCase();
    return allOptions.filter((o) => o.label.toLowerCase().includes(q));
  }, [allOptions, query]);

  const hasExactMatch = allOptions.some((o) => o.label.toLowerCase() === query.trim().toLowerCase());
  const canOfferCreate = query.trim().length > 0 && !hasExactMatch;

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  function selectOption(option: EditableSelectOption) {
    onValueChange(option.value);
    setOpen(false);
  }

  async function handleCreate() {
    const typed = query.trim();
    if (!typed) return;
    setIsCreating(true);
    try {
      const newOption = onCreateOption ? await onCreateOption(typed) : { value: typed, label: typed };
      setLocalOptions((prev) => [...prev, newOption]);
      onValueChange(newOption.value);
      setOpen(false);
    } catch {
      // Creation was cancelled or failed upstream (e.g. a follow-up dialog was
      // dismissed) — leave the dropdown open with the typed text intact.
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("w-full justify-between font-normal", !selectedLabel && "text-muted-foreground", className)}
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="border-b p-2">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (filtered.length > 0) selectOption(filtered[0]);
                else if (canOfferCreate) handleCreate();
              }
            }}
          />
        </div>
        <div className="max-h-56 overflow-y-auto scrollbar-thin p-1">
          {filtered.length === 0 && !canOfferCreate && (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">{emptyMessage}</p>
          )}
          {filtered.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => selectOption(option)}
              className={cn(
                "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent",
                option.value === value && "bg-accent/60"
              )}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          ))}
          {canOfferCreate && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-60"
            >
              {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add &quot;{query.trim()}&quot;
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
