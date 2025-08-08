"use client";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SummaryHeader({ title, duration }: { title: string; duration?: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {duration && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="size-3" />
          {duration}
        </Badge>
      )}
    </div>
  );
}

