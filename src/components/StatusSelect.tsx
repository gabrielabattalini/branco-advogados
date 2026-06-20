"use client";

import type { Status } from "@/lib/mock";
import { STATUS_LIST, corDoStatus } from "@/lib/mock";

export function StatusSelect({
  value,
  onChange,
  compact = false,
}: {
  value: Status;
  onChange: (s: Status) => void;
  compact?: boolean;
}) {
  const c = corDoStatus(value);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Status)}
      aria-label="Status da tarefa"
      className={
        "cursor-pointer rounded border bg-surface " +
        (compact ? "px-1.5 py-0.5 text-[10.5px] " : "px-2 py-1 text-[11px] ") +
        `${c.border} ${c.text}`
      }
    >
      {STATUS_LIST.map((s) => (
        <option key={s.key} value={s.key}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
