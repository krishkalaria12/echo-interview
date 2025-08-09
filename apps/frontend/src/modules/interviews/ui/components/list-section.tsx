"use client";
import { CheckCircle2, XCircle } from "lucide-react";

function normalizeItems(raw?: string | null): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  // Try JSON array
  try {
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v));
      if (parsed && typeof parsed === "object") return Object.values(parsed).map((v) => String(v));
    }
  } catch {}
  // Handle pseudo-JSON like {"a","b","c"}
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    const inner = trimmed.slice(1, -1);
    const split = inner.split(/\",\s*\"/g).map((s) => s.replace(/^\"|\"$/g, "").trim());
    const filtered = split.filter(Boolean);
    if (filtered.length > 1) return filtered;
  }
  // Fallback: split by newline, semicolon or period+space
  const parts = trimmed
    .split(/\n|;|\.,\s|\.[\s\r\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts;
}

export function ListSection({
  title,
  items,
  positive = true,
}: {
  title: string;
  items?: string | null;
  positive?: boolean;
}) {
  const arr = normalizeItems(items);
  const Icon = positive ? CheckCircle2 : XCircle;
  const iconClass = positive ? "text-emerald-600" : "text-amber-600";
  return (
    <div>
      <h3 className="font-medium mb-2">{title}</h3>
      {arr.length === 0 ? (
        <p className="text-muted-foreground">No data</p>
      ) : (
        <ul className="space-y-2">
          {arr.map((line, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Icon className={`mt-0.5 size-4 ${iconClass}`} />
              <span className="leading-relaxed">{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

