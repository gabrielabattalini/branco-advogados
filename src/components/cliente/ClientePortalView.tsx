"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, KeyRound, Scale, Check, X } from "lucide-react";
import type { ProcessoCliente } from "@/lib/data";
import { sairCliente, alterarSenhaCliente } from "@/lib/cliente-actions";

function dataBR(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

const AREA_LABEL: Record<string, string> = {
  civel: "Cível",
  trabalhista: "Trabalhista",
};

export function ClientePortalView({
  nomeCliente,
  processos,
}: {
  nomeCliente: string;
  processos: ProcessoCliente[];
}) {
  const router = useRouter();
  const [trocando, setTrocando] = useState(false);
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  const sair = async () => {
    await sairCliente();
    router.replace("/cliente/entrar");
    router.refresh();
  };

  const trocarSenha = async () => {
    setMsg(null);
    const res = await alterarSenhaCliente({ atual, nova });
    if (res.ok) {
      setMsg({ ok: true, texto: "Senha alterada." });
      setAtual("");
      setNova("");
      setTrocando(false);
    } else setMsg({ ok: false, texto: res.erro });
  };

  return (
    <div>
      {/* Cabeçalho próprio do portal */}
      <header className="border-b border-line bg-navy">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <div className="font-serif text-lg font-semibold leading-none text-cream">
              BRANCO
            </div>
            <div className="text-[9px] tracking-[0.3em] text-gold">
              ADVOGADOS
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTrocando((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md border border-cream/25 px-2.5 py-1.5 text-[12px] text-cream/90 hover:bg-white/10"
            >
              <KeyRound size={14} /> Senha
            </button>
            <button
              onClick={sair}
              className="inline-flex items-center gap-1.5 rounded-md border border-cream/25 px-2.5 py-1.5 text-[12px] text-cream/90 hover:bg-white/10"
            >
              <LogOut size={14} /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="font-serif text-2xl text-navy">{nomeCliente}</h1>
        <p className="mt-0.5 mb-5 text-[13px] text-muted">
          Situação atual dos seus processos. Em caso de dúvida, fale com o seu
          advogado.
        </p>

        {trocando && (
          <div className="mb-5 rounded-lg border border-line bg-surface p-4">
            <div className="mb-2 text-[13px] font-medium text-navy">
              Alterar senha
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="password"
                value={atual}
                onChange={(e) => setAtual(e.target.value)}
                placeholder="Senha atual"
                className="flex-1 rounded-md border border-line bg-cream/40 px-3 py-2 text-sm text-ink outline-none focus:border-navy/60"
              />
              <input
                type="password"
                value={nova}
                onChange={(e) => setNova(e.target.value)}
                placeholder="Nova senha (mín. 6)"
                className="flex-1 rounded-md border border-line bg-cream/40 px-3 py-2 text-sm text-ink outline-none focus:border-navy/60"
              />
              <button
                onClick={trocarSenha}
                disabled={!atual || !nova}
                className="rounded-md bg-navy px-3 py-2 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
              >
                Salvar
              </button>
            </div>
          </div>
        )}
        {msg && (
          <div
            className={
              "mb-4 flex items-center gap-2 rounded-md px-3 py-2 text-[13px] " +
              (msg.ok ? "bg-ok/10 text-ok" : "bg-danger/10 text-danger")
            }
          >
            {msg.ok ? <Check size={15} /> : <X size={15} />} {msg.texto}
          </div>
        )}

        {processos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-surface px-4 py-12 text-center text-[13px] text-faint">
            Nenhum processo disponível no momento.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {processos.map((p) => (
              <section
                key={p.numero}
                className="rounded-lg border border-line bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Scale size={15} className="shrink-0 text-gold" />
                      <span className="font-mono text-[13.5px] text-ink">
                        {p.numero}
                      </span>
                    </div>
                    <div className="mt-0.5 pl-[23px] text-[12px] text-muted">
                      {p.parteContraria && `Parte contrária: ${p.parteContraria}`}
                      {p.tribunal ? ` · ${p.tribunal}` : ""}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-navy/8 px-2 py-0.5 text-[11px] text-navy">
                    {AREA_LABEL[p.area] ?? p.area}
                  </span>
                </div>

                <div className="mt-3 border-t border-line pt-3">
                  <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-faint">
                    Andamento
                  </div>
                  {p.andamentos.length === 0 ? (
                    <p className="text-[13px] text-muted">
                      Sem atualização registrada no momento.
                    </p>
                  ) : (
                    <ol className="flex flex-col gap-2.5">
                      {p.andamentos.map((a, i) => (
                        <li
                          key={i}
                          className={
                            "border-l-2 pl-3 " +
                            (i === 0 ? "border-gold" : "border-gold/30")
                          }
                        >
                          <div className="text-[11px] text-faint">
                            {dataBR(a.quando)}
                            {i === 0 && " · atual"}
                          </div>
                          <p className="whitespace-pre-wrap text-[13.5px] text-ink">
                            {a.texto}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-[11px] text-faint">
          © {new Date().getFullYear()} Branco Advogados · Área do cliente.{" "}
          <a href="/privacidade" className="underline hover:text-muted">
            Privacidade
          </a>
        </p>
      </main>
    </div>
  );
}
