"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Scale,
  ListChecks,
  Calendar,
  Folder,
  Newspaper,
  UserCog,
} from "lucide-react";

const nav = [
  { href: "/painel", label: "Painel", Icon: LayoutDashboard },
  { href: "/contatos", label: "Contatos", Icon: Users },
  { href: "/processos", label: "Processos", Icon: Scale },
  { href: "/tarefas", label: "Tarefas", Icon: ListChecks },
  { href: "/agenda", label: "Agenda", Icon: Calendar },
  { href: "/documentos", label: "Documentos", Icon: Folder },
  { href: "/publicacoes", label: "Publicações", Icon: Newspaper },
  { href: "/perfil", label: "Perfil", Icon: UserCog },
];

export function Sidebar({
  nome,
  papel,
  iniciais,
}: {
  nome: string;
  papel: string;
  iniciais: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-navy px-3 py-5">
      <div className="px-3 pb-6">
        <div className="font-serif text-xl leading-none text-gold-light">
          Branco
        </div>
        <div className="mt-1 text-[10px] tracking-[0.25em] text-cream/40">
          ADVOGADOS
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {nav.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors " +
                (active
                  ? "bg-gold/15 font-medium text-gold-light"
                  : "text-cream/70 hover:bg-white/5 hover:text-cream")
              }
            >
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex items-center gap-3 border-t border-white/10 px-2 pt-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-xs font-medium text-gold-light">
          {iniciais}
        </div>
        <div className="leading-tight">
          <div className="text-sm text-cream">{nome}</div>
          <div className="text-[11px] text-cream/40">
            {papel === "coordenador" ? "Coordenador" : "Advogado"}
          </div>
        </div>
      </div>
    </aside>
  );
}
