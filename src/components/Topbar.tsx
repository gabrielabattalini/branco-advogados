import { Search, Bell, Plus } from "lucide-react";
import { RoleSwitcher } from "@/components/RoleSwitcher";

export function Topbar({ papel }: { papel: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-line px-8">
      <div className="flex w-80 items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-faint">
        <Search size={16} />
        <span>Buscar processo, contato ou tarefa…</span>
      </div>
      <div className="flex items-center gap-3">
        <RoleSwitcher papel={papel} />
        <button className="flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm text-cream transition-colors hover:bg-navy-dark">
          <Plus size={16} />
          Nova tarefa
        </button>
        <button
          className="text-muted transition-colors hover:text-ink"
          aria-label="Notificações"
        >
          <Bell size={20} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
