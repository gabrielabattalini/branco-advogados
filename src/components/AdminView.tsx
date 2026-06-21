"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Avatar } from "@/components/Avatar";
import { PAPEIS, labelPapel } from "@/lib/papeis";
import { criarUsuario, alterarPapel, alternarAtivo } from "@/lib/auth-actions";
import type { UsuarioAdmin } from "@/lib/data";

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[12px] text-muted";

export function AdminView({
  usuarios,
  me,
}: {
  usuarios: UsuarioAdmin[];
  me: { id: string; papel: string };
}) {
  const router = useRouter();
  const souSocio = me.papel === "socio";
  const papeisDisponiveis = souSocio
    ? PAPEIS
    : PAPEIS.filter((p) => p !== "socio");

  const [showNovo, setShowNovo] = useState(false);
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [area, setArea] = useState("civel");
  const [papel, setPapel] = useState("advogado");

  const criar = async () => {
    if (busy || !nome.trim() || !email.trim() || !senha) return;
    setBusy("novo");
    setErro("");
    const res = await criarUsuario({ nome, email, senha, area, papel });
    if (res.ok) {
      setShowNovo(false);
      setNome("");
      setEmail("");
      setSenha("");
      setArea("civel");
      setPapel("advogado");
      router.refresh();
    } else {
      setErro(res.erro);
    }
    setBusy(null);
  };

  const mudarPapel = async (u: UsuarioAdmin, novo: string) => {
    if (novo === u.papel) return;
    setBusy(u.id);
    setErro("");
    const res = await alterarPapel({ id: u.id, papel: novo });
    if (!res.ok) setErro(res.erro);
    router.refresh();
    setBusy(null);
  };

  const toggleAtivo = async (u: UsuarioAdmin) => {
    setBusy(u.id);
    setErro("");
    const res = await alternarAtivo({ id: u.id, ativo: !u.ativo });
    if (!res.ok) setErro(res.erro);
    router.refresh();
    setBusy(null);
  };

  // Não posso mexer em mim mesmo; só o sócio mexe em sócios.
  const podeEditar = (u: UsuarioAdmin) =>
    u.id !== me.id && (souSocio || u.papel !== "socio");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-navy">Administração</h1>
        <button
          onClick={() => setShowNovo(true)}
          className="inline-flex items-center gap-2 rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark"
        >
          <Plus size={16} /> Novo usuário
        </button>
      </div>
      <p className="mt-1 mb-4 text-[13px] text-muted">
        Cadastre usuários e defina o tipo de acesso. Sócio diretor e
        coordenadores veem tudo do escritório; advogados, apenas o que é seu.
      </p>

      {erro && (
        <div className="mb-3 rounded-md bg-danger/10 px-3 py-2 text-[13px] text-danger">
          {erro}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {usuarios.map((u, i) => {
          const editavel = podeEditar(u);
          const opcoes = Array.from(new Set([u.papel, ...papeisDisponiveis]));
          return (
            <div
              key={u.id}
              className={
                "flex flex-wrap items-center gap-3 px-4 py-3 " +
                (i > 0 ? "border-t border-line " : "") +
                (u.ativo ? "" : "opacity-60")
              }
            >
              <Avatar ini={u.iniciais} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-ink">
                  {u.nome}
                  {u.id === me.id && (
                    <span className="ml-1 text-[11px] text-faint">(você)</span>
                  )}
                  {!u.ativo && (
                    <span className="ml-1 text-[11px] text-faint">
                      · inativo
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-faint">{u.email}</div>
              </div>
              <select
                value={u.papel}
                disabled={!editavel || busy === u.id}
                onChange={(e) => mudarPapel(u, e.target.value)}
                aria-label={`Acesso de ${u.nome}`}
                className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink outline-none disabled:opacity-50"
              >
                {opcoes.map((p) => (
                  <option key={p} value={p}>
                    {labelPapel(p)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => toggleAtivo(u)}
                disabled={!editavel || busy === u.id}
                className={
                  "rounded-md border px-2.5 py-1.5 text-[12px] disabled:opacity-40 " +
                  (u.ativo
                    ? "border-line text-muted hover:bg-cream"
                    : "border-ok/40 text-ok hover:bg-ok/10")
                }
              >
                {u.ativo ? "Desativar" : "Ativar"}
              </button>
            </div>
          );
        })}
      </div>

      {showNovo && (
        <Modal
          titulo="Novo usuário"
          onClose={() => setShowNovo(false)}
          footer={
            <>
              <button
                onClick={() => setShowNovo(false)}
                className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:bg-surface"
              >
                Cancelar
              </button>
              <button
                onClick={criar}
                disabled={
                  busy === "novo" || !nome.trim() || !email.trim() || !senha
                }
                className="rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
              >
                {busy === "novo" ? "Criando…" : "Criar usuário"}
              </button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor="adm-nome" className={labelCls}>
                Nome completo
              </label>
              <input
                id="adm-nome"
                className={inputCls}
                value={nome}
                maxLength={120}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Mariana Souza"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="adm-email" className={labelCls}>
                E-mail do escritório
              </label>
              <input
                id="adm-email"
                type="email"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@brancoadvogados.com"
              />
            </div>
            <div>
              <label htmlFor="adm-senha" className={labelCls}>
                Senha provisória (mín. 8 caracteres)
              </label>
              <input
                id="adm-senha"
                type="text"
                className={inputCls}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="A pessoa troca depois no Perfil"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="adm-area" className={labelCls}>
                  Área de atuação
                </label>
                <select
                  id="adm-area"
                  className={inputCls}
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                >
                  <option value="civel">Cível</option>
                  <option value="trabalhista">Trabalhista</option>
                </select>
              </div>
              <div>
                <label htmlFor="adm-papel" className={labelCls}>
                  Tipo de acesso
                </label>
                <select
                  id="adm-papel"
                  className={inputCls}
                  value={papel}
                  onChange={(e) => setPapel(e.target.value)}
                >
                  {papeisDisponiveis.map((p) => (
                    <option key={p} value={p}>
                      {labelPapel(p)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[11px] text-faint">
              O e-mail deve ser @brancoadvogados.com. A senha é provisória — a
              pessoa pode trocá-la no Perfil.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
