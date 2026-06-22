"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { labelPapel } from "@/lib/papeis";
import { editarUsuario } from "@/lib/auth-actions";
import type { UsuarioAdmin } from "@/lib/data";

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[12px] text-muted";

export function EditarUsuarioModal({
  usuario,
  onClose,
}: {
  usuario: UsuarioAdmin;
  onClose: () => void;
}) {
  const router = useRouter();
  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  const [area, setArea] = useState(usuario.area);
  const [novaSenha, setNovaSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const submit = async () => {
    if (salvando || !nome.trim() || !email.trim()) return;
    setSalvando(true);
    setErro("");
    const res = await editarUsuario({
      id: usuario.id,
      nome,
      email,
      area,
      novaSenha: novaSenha || undefined,
    });
    if (res.ok) {
      router.refresh();
      onClose();
      return;
    }
    setErro(res.erro);
    setSalvando(false);
  };

  return (
    <Modal
      titulo="Editar usuário"
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:bg-surface"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={salvando || !nome.trim() || !email.trim()}
            className="rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
          >
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="edu-nome" className={labelCls}>
            Nome
          </label>
          <input
            id="edu-nome"
            className={inputCls}
            value={nome}
            maxLength={120}
            onChange={(e) => setNome(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="edu-email" className={labelCls}>
            E-mail
          </label>
          <input
            id="edu-email"
            type="email"
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@brancoadvogados.com"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="edu-area" className={labelCls}>
              Área de atuação
            </label>
            <select
              id="edu-area"
              className={inputCls}
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              <option value="civel">Cível</option>
              <option value="trabalhista">Trabalhista</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Tipo de acesso</label>
            <div className="rounded-md border border-line bg-cream px-3 py-2 text-sm text-muted">
              {labelPapel(usuario.papel)}
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="edu-senha" className={labelCls}>
            Nova senha (opcional)
          </label>
          <input
            id="edu-senha"
            type="text"
            className={inputCls}
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder="Deixe em branco para manter a atual"
          />
        </div>
        <p className="text-[11px] text-faint">
          O tipo de acesso é alterado pelo seletor na lista. Para redefinir a
          senha de alguém, preencha a nova senha (mín. 8 caracteres).
        </p>
        {erro && <p className="text-[12px] text-danger">{erro}</p>}
      </div>
    </Modal>
  );
}
