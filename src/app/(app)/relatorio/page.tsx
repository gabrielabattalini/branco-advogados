import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, FileBarChart, Users, ChevronRight } from "lucide-react";
import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";

export const dynamic = "force-dynamic";

const relatorios = [
  {
    href: "/relatorio/diario",
    Icon: CalendarDays,
    titulo: "Relatório diário",
    descricao:
      "O que cada pessoa fez no dia (criou, mandou pra revisão, concluiu, comentou). Prévia na tela, PDF e envio às 19h.",
    pronto: true,
  },
  {
    href: "/relatorio/mensal",
    Icon: FileBarChart,
    titulo: "Relatório mensal",
    descricao:
      "Produtividade da equipe no mês: concluídas, no prazo vs. fora do prazo, % no prazo e atrasos. Imprimível em PDF.",
    pronto: true,
  },
  {
    href: "/relatorio/clientes",
    Icon: Users,
    titulo: "Relatório dos clientes",
    descricao:
      "Um relatório por cliente, no papel timbrado, com a situação atual de cada processo. E-mail de envio e botão de enviar em cada cliente; automático até o dia 5.",
    pronto: true,
  },
];

export default async function RelatoriosPage() {
  const s = await getSessao();
  if (!s) redirect("/login");
  if (!ehGestor(s.papel)) redirect("/painel");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-2xl text-navy">Relatórios</h1>
      <p className="mt-1 mb-5 text-[13px] text-muted">
        Escolha o tipo de relatório.
      </p>

      <div className="flex flex-col gap-3">
        {relatorios.map(({ href, Icon, titulo, descricao, pronto }) => {
          const inner = (
            <div
              className={
                "flex items-start gap-4 rounded-lg border border-line bg-surface p-5 " +
                (pronto ? "hover:border-navy/40 hover:bg-cream/40" : "opacity-60")
              }
            >
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-navy/10 text-navy">
                <Icon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-medium text-navy">
                    {titulo}
                  </span>
                  {!pronto && (
                    <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold">
                      em breve
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[12.5px] text-muted">{descricao}</p>
              </div>
              {pronto && (
                <ChevronRight size={18} className="mt-1 shrink-0 text-faint" />
              )}
            </div>
          );
          return pronto ? (
            <Link key={titulo} href={href}>
              {inner}
            </Link>
          ) : (
            <div key={titulo}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
