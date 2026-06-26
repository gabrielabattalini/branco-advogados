import { redirect } from "next/navigation";
import { getUsuarios, getAcessosRecentes } from "@/lib/data";
import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";
import { AdminView } from "@/components/AdminView";

export const dynamic = "force-dynamic";

const EVENTO: Record<string, { label: string; cls: string }> = {
  sucesso: { label: "Entrou", cls: "text-ok" },
  novo_aparelho: { label: "Entrou (aparelho novo)", cls: "text-ok" },
  codigo_enviado: { label: "Código enviado", cls: "text-muted" },
  codigo_errado: { label: "Código errado", cls: "text-danger" },
  senha_errada: { label: "Senha errada", cls: "text-danger" },
  bloqueado: { label: "Bloqueado", cls: "text-danger" },
};

function quandoBR(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPage() {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");
  if (!ehGestor(sessao.papel)) redirect("/painel");
  const [usuarios, acessos] = await Promise.all([
    getUsuarios(),
    getAcessosRecentes(),
  ]);
  return (
    <div className="mx-auto max-w-4xl">
      <AdminView usuarios={usuarios} me={{ id: sessao.id, papel: sessao.papel }} />

      <section className="mt-10">
        <h2 className="mb-1 font-serif text-xl text-navy">Acessos recentes</h2>
        <p className="mb-3 text-[13px] text-muted">
          Registro de entradas e tentativas (auditoria). Últimos {acessos.length}.
        </p>
        {acessos.length === 0 ? (
          <div className="rounded-lg border border-line bg-surface px-4 py-8 text-center text-[13px] text-faint">
            Nenhum acesso registrado ainda.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line">
            <table className="w-full text-[12.5px]">
              <thead className="bg-surface text-left text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Quando</th>
                  <th className="px-3 py-2 font-medium">Quem</th>
                  <th className="px-3 py-2 font-medium">Evento</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">
                    Aparelho
                  </th>
                </tr>
              </thead>
              <tbody>
                {acessos.map((a) => {
                  const ev = EVENTO[a.evento] ?? {
                    label: a.evento,
                    cls: "text-muted",
                  };
                  return (
                    <tr key={a.id} className="border-t border-line bg-white">
                      <td className="whitespace-nowrap px-3 py-2 text-muted">
                        {quandoBR(a.quando)}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-navy">{a.nome}</span>
                        <span className="block text-[11px] text-faint">
                          {a.email}
                        </span>
                      </td>
                      <td className={"px-3 py-2 " + ev.cls}>{ev.label}</td>
                      <td className="hidden px-3 py-2 text-muted sm:table-cell">
                        {a.navegador || "—"}
                        {a.ip ? (
                          <span className="block text-[11px] text-faint">
                            {a.ip}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
