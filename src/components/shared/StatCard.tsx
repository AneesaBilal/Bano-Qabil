import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  iconClassName?: string;
  emptyHint?: string;
  emptyActionLabel?: string;
  emptyActionTo?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  iconClassName,
  emptyHint,
  emptyActionLabel,
  emptyActionTo,
}: StatCardProps) {

  const isEmpty =
    typeof value === "number" &&
    value === 0 &&
    Boolean(emptyHint);

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="flex min-h-[170px] flex-col items-center justify-center p-5 text-center">

        <div className={cn("mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary", iconClassName)}>
          <Icon className="h-6 w-6" />
        </div>

        <p className="text-sm font-medium text-muted-foreground">
          {label}
        </p>

        <h2 className="mt-1 text-3xl font-bold">
          {value}
        </h2>

        {isEmpty && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              {emptyHint}
            </p>

            {emptyActionLabel && emptyActionTo && (
              <Button
                asChild
                size="sm"
                variant="outline"
              >
                <Link to={emptyActionTo}>
                  {emptyActionLabel}
                </Link>
              </Button>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
