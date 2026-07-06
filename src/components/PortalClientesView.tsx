"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  KeyRound,
  Power,
  Link as LinkIcon,
  Check,
  Search,
} from "lucide-react";
import type { AcessoCliente } from "@/lib/data";
import {
  criarAcessoCliente,
  resetarSenhaCliente,
  alternarAtivoCliente,
} from "@/lib/cliente-actions";

function slug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
}

function dataBR(iso: string | null): string {
  if (!iso) return "nunca";
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60";

export function PortalClientesView({
  acessos,
  nomesClientes,
}: {
  acessos: AcessoCliente[];
  nomesClientes: string[];
}) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [buscaNome, setBuscaNome] = useState("");
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState("");

  const origem =
    typeof window !== "undefined" ? window.location.origin : "";

  const nomesFiltrados = useMemo(() => {
    const q = buscaNome.trim().toLowerCase();
    return (q ? nomesClientes.filter((n) => n.toLowerCase().includes(q)) : nomesClientes).slice(
      0,
      8,
    );
  }, [buscaNome, nomesClientes]);

  const escolherNome = (n: string) => {
    setNome(n);
    setBuscaNome(n);
    if (!login) setLogin(slug(n));
  };

  const criar = async () => {
    if (salvando) return;
    setSalvando(true);
    setErro("");
    const res = await criarAcessoCliente({ nomeCliente: nome, login, senha });
    if (res.ok) {
      setNome("");
      setBuscaNome("");
      setLogin("");
      setSenha("");
      router.refresh();
    } else setErro(res.erro);
    setSalvando(false);
  };

  const resetar = async (id: string) => {
    const s = prompt("Nova senha para este cliente (mín. 6 caracteres):");
    if (!s) return;
    const res = await resetarSenhaCliente({ id, senha: s });
    if (!res.ok) alert(res.erro);
    else router.refresh();
  };

  const alternar = async (id: string) => {
    const res = await alternarAtivoCliente(id);
    if (!res.ok) alert(res.erro);
    else router.refresh();
  };

  const copiarLink = (l: string) => {
    const url = `${origem}/cliente/entrar?e=${encodeURIComponent(l)}`;
    navigator.clipboard?.writeText(url);
    setCopiado(l);
    setTimeout(() => setCopiado(""), 1500);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-2xl text-navy">Portal do cliente</h1>
      <p className="mt-1 mb-5 text-[13px] text-muted">
        Crie acessos para os clientes acompanharem, só leitura, a situação dos
        processos deles. Cada acesso vê apenas os processos cujo cliente casa com
        o nome escolhido.
      </p>

      {/* Criar acesso */}
      <div className="mb-6 rounded-lg border border-line bg-surface p-5">
        <div className="mb-3 flex items-center gap-2 text-[14px] font-medium text-navy">
          <UserPlus size={16} /> Novo acesso
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="relative">
            <label className="mb-1 block text-[12px] text-muted">Cliente</label>
            <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-2 focus-within:border-navy/60">
              <Search size={14} className="shrink-0 text-faint" />
              <input
                value={buscaNome}
                onChange={(e) => {
                  setBuscaNome(e.target.value);
                  setNome(e.target.value);
                }}
                placeholder="Buscar cliente…"
                className="w-full bg-transparent text-sm text-ink outline-none"
              />
            </div>
            {buscaNome && nome !== buscaNome && nomesFiltrados.length > 0 && (
              <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-auto rounded-md border border-line bg-surface shadow-lg">
                {nomesFiltrados.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => escolherNome(n)}
                    className="block w-full border-t border-line px-3 py-2 text-left text-[12.5px] text-ink first:border-t-0 hover:bg-cream"
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-muted">
              Acesso (login)
            </label>
            <input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="ex.: construtorahabita"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] text-muted">
              Senha inicial
            </label>
            <input
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="mín. 6 caracteres"
              className={inputCls}
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={criar}
            disabled={salvando || !nome || login.length < 3 || senha.length < 6}
            className="rounded-md bg-navy px-4 py-2 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
          >
            {salvando ? "Criando…" : "Criar acesso"}
          </button>
          {erro && <span className="text-[12px] text-danger">{erro}</span>}
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {acessos.length === 0 && (
          <div className="px-4 py-10 text-center text-[13px] text-faint">
            Nenhum acesso criado ainda.
          </div>
        )}
        {acessos.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3 first:border-t-0"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[13px] text-ink">
                <span className="truncate font-medium">{a.nomeCliente}</span>
                {!a.ativo && (
                  <span className="rounded bg-line px-1.5 py-0.5 text-[9px] uppercase text-faint">
                    inativo
                  </span>
                )}
                {a.processos === 0 && (
                  <span className="rounded bg-danger/10 px-1.5 py-0.5 text-[9px] uppercase text-danger">
                    sem processo
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 text-[11px] text-faint">
                <span className="font-mono">{a.login}</span>
                <span>{a.processos} processo(s)</span>
                <span>último acesso: {dataBR(a.ultimoAcesso)}</span>
              </div>
            </div>
            <button
              onClick={() => copiarLink(a.login)}
              className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] text-navy hover:bg-cream"
            >
              {copiado === a.login ? <Check size={13} /> : <LinkIcon size={13} />}
              {copiado === a.login ? "copiado" : "link"}
            </button>
            <button
              onClick={() => resetar(a.id)}
              className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] text-navy hover:bg-cream"
            >
              <KeyRound size={13} /> senha
            </button>
            <button
              onClick={() => alternar(a.id)}
              className={
                "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] " +
                (a.ativo
                  ? "border-line text-danger hover:bg-cream"
                  : "border-line text-ok hover:bg-cream")
              }
            >
              <Power size={13} /> {a.ativo ? "desativar" : "ativar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
