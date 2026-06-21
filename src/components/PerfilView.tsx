"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LogOut } from "lucide-react";
import { salvarPerfil } from "@/lib/actions";
import { alterarSenha, sair } from "@/lib/auth-actions";

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[13px] text-muted";

export function PerfilView({
  inicial,
}: {
  inicial: { nome: string; email: string; area: string; papel: string };
}) {
  const router = useRouter();
  const [nome, setNome] = useState(inicial.nome);
  const [area, setArea] = useState(inicial.area);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState("");

  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [conf, setConf] = useState("");
  const [trocando, setTrocando] = useState(false);
  const [senhaMsg, setSenhaMsg] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );

  const submit = async () => {
    if (salvando) return;
    setSalvando(true);
    setSalvo(false);
    setErro("");
    const res = await salvarPerfil({ nome, area });
    if (res.ok) {
      router.refresh();
      setSalvo(true);
    } else {
      setErro(res.erro);
    }
    setSalvando(false);
  };

  const trocarSenha = async () => {
    if (trocando) return;
    setSenhaMsg(null);
    if (nova !== conf) {
      setSenhaMsg({ ok: false, texto: "A confirmação não confere." });
      return;
    }
    setTrocando(true);
    const res = await alterarSenha({ atual, nova });
    if (res.ok) {
      setSenhaMsg({ ok: true, texto: "Senha alterada com sucesso." });
      setAtual("");
      setNova("");
      setConf("");
    } else {
      setSenhaMsg({ ok: false, texto: res.erro });
    }
    setTrocando(false);
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-serif text-2xl text-navy">Perfil</h1>
      <p className="mt-1 mb-5 text-[13px] text-muted">
        Seus dados de acesso ao sistema.
      </p>

      <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
        <div>
          <label htmlFor="perfil-nome" className={labelCls}>
            Nome
          </label>
          <input
            id="perfil-nome"
            className={inputCls}
            value={nome}
            maxLength={120}
            onChange={(e) => {
              setNome(e.target.value);
              setSalvo(false);
            }}
            placeholder="Nome completo"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="perfil-email" className={labelCls}>
              E-mail (login)
            </label>
            <input
              id="perfil-email"
              className={inputCls + " cursor-not-allowed opacity-70"}
              value={inicial.email}
              readOnly
            />
          </div>
          <div>
            <label htmlFor="perfil-area" className={labelCls}>
              Área de atuação
            </label>
            <select
              id="perfil-area"
              className={inputCls}
              value={area}
              onChange={(e) => {
                setArea(e.target.value);
                setSalvo(false);
              }}
            >
              <option value="civel">Cível</option>
              <option value="trabalhista">Trabalhista</option>
            </select>
          </div>
        </div>

        <div className="rounded-md bg-cream px-3 py-2.5 text-[12px] text-muted">
          Seu perfil de acesso é{" "}
          <span className="font-medium text-navy">
            {inicial.papel === "coordenador" ? "Coordenador" : "Advogado"}
          </span>
          .{" "}
          {inicial.papel === "coordenador"
            ? "Você vê todas as tarefas e agendas do escritório, pode alterar prazos e excluir tarefas."
            : "Você vê e mexe apenas nas suas tarefas e na sua agenda. O coordenador pode ajustar seu acesso."}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={submit}
            disabled={salvando}
            className="rounded-md bg-navy px-4 py-2 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
          >
            {salvando ? "Salvando…" : "Salvar"}
          </button>
          {salvo && (
            <span className="inline-flex items-center gap-1 text-[13px] text-ok">
              <Check size={15} /> Salvo
            </span>
          )}
          {erro && <span className="text-[13px] text-danger">{erro}</span>}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
        <div>
          <h2 className="text-[15px] font-medium text-navy">Alterar senha</h2>
          <p className="mt-0.5 text-[12px] text-muted">
            Mínimo de 6 caracteres.
          </p>
        </div>
        <div>
          <label htmlFor="senha-atual" className={labelCls}>
            Senha atual
          </label>
          <input
            id="senha-atual"
            type="password"
            autoComplete="current-password"
            className={inputCls}
            value={atual}
            onChange={(e) => setAtual(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="senha-nova" className={labelCls}>
              Nova senha
            </label>
            <input
              id="senha-nova"
              type="password"
              autoComplete="new-password"
              className={inputCls}
              value={nova}
              onChange={(e) => setNova(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="senha-conf" className={labelCls}>
              Confirmar nova senha
            </label>
            <input
              id="senha-conf"
              type="password"
              autoComplete="new-password"
              className={inputCls}
              value={conf}
              onChange={(e) => setConf(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={trocarSenha}
            disabled={trocando || !atual || !nova || !conf}
            className="rounded-md border border-line px-4 py-2 text-sm text-navy hover:bg-cream disabled:opacity-40"
          >
            {trocando ? "Alterando…" : "Alterar senha"}
          </button>
          {senhaMsg && (
            <span
              className={
                "text-[13px] " + (senhaMsg.ok ? "text-ok" : "text-danger")
              }
            >
              {senhaMsg.texto}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface p-5">
        <div>
          <div className="text-[14px] text-ink">Encerrar sessão</div>
          <div className="text-[12px] text-muted">
            Sair desta conta neste navegador.
          </div>
        </div>
        <form action={sair}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-4 py-2 text-sm text-danger transition-colors hover:bg-cream"
          >
            <LogOut size={16} /> Sair da conta
          </button>
        </form>
      </div>
    </div>
  );
}
