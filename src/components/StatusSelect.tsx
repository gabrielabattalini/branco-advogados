"use client";

import type { Status } from "@/lib/mock";

const styleByStatus: Record<Status, string> = {
  a_fazer: "border-line text-muted",
  em_curso: "border-info/40 text-info",
  concluida: "border-ok/40 text-ok",
};

export function StatusSelect({
  value,
  onChange,
  compact = false,
}: {
  value: Status;
  onChange: (s: Status) => void;
  compact?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Status)}
      aria-label="Status da tarefa"
      className={
        "cursor-pointer rounded border bg-surface " +
        (compact ? "px-1.5 py-0.5 text-[10.5px] " : "px-2 py-1 text-[11px] ") +
        styleByStatus[value]
      }
    >
      <option value="a_fazer">A fazer</option>
      <option value="em_curso">Em curso</option>
      <option value="concluida">Concluída</option>
    </select>
  );
}
