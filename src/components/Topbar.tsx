import { Search, Bell, LogOut } from "lucide-react";
import { labelPapel } from "@/lib/papeis";
import { sair } from "@/lib/auth-actions";

export function Topbar({ nome, papel }: { nome: string; papel: string }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-line px-8">
      <div className="flex w-80 items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-faint">
        <Search size={16} />
        <span>Buscar processo, contato ou tarefa…</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right leading-tight">
          <div className="text-[13px] text-ink">{nome}</div>
          <div className="text-[11px] text-faint">{labelPapel(papel)}</div>
        </div>
        <button
          className="text-muted transition-colors hover:text-ink"
          aria-label="Notificações"
        >
          <Bell size={20} strokeWidth={1.75} />
        </button>
        <form action={sair}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <LogOut size={16} /> Sair
          </button>
        </form>
      </div>
    </header>
  );
}
