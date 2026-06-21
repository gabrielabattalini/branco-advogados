"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { salvarPerfil } from "@/lib/actions";

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
  const [email, setEmail] = useState(inicial.email);
  const [area, setArea] = useState(inicial.area);
  const [papel, setPapel] = useState(inicial.papel);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const submit = async () => {
    if (salvando) return;
    setSalvando(true);
    setSalvo(false);
    await salvarPerfil({ nome, email, area, papel });
    router.refresh();
    setSalvando(false);
    setSalvo(true);
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-serif text-2xl text-navy">Perfil</h1>
      <p className="mt-1 mb-5 text-[13px] text-muted">
        Configure seus dados e seu perfil de acesso. Quando o login Microsoft
        estiver ativo, nome e e-mail virão automaticamente da sua conta.
      </p>

      <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
        <div>
          <label className={labelCls}>Nome</label>
          <input
            className={inputCls}
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              setSalvo(false);
            }}
            placeholder="Nome completo"
          />
        </div>
        <div>
          <label className={labelCls}>E-mail</label>
          <input
            className={inputCls}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSalvo(false);
            }}
            placeholder="nome@brancoadvogados.com"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Área de atuação</label>
            <select
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
          <div>
            <label className={labelCls}>Perfil de acesso</label>
            <select
              className={inputCls}
              value={papel}
              onChange={(e) => {
                setPapel(e.target.value);
                setSalvo(false);
              }}
            >
              <option value="advogado">Advogado</option>
              <option value="coordenador">Coordenador</option>
            </select>
          </div>
        </div>

        <div className="rounded-md bg-cream px-3 py-2.5 text-[12px] text-muted">
          {papel === "coordenador" ? (
            <>
              <span className="font-medium text-navy">Coordenador:</span> vê todas
              as tarefas e agendas do escritório, pode alterar prazos e excluir
              tarefas.
            </>
          ) : (
            <>
              <span className="font-medium text-navy">Advogado:</span> vê e mexe
              apenas nas suas tarefas e na sua agenda; não altera prazos nem
              exclui tarefas.
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={submit}
            disabled={salvando}
            className="rounded-md bg-navy px-4 py-2 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
          >
            {salvando ? "Salvando…" : "Salvar perfil"}
          </button>
          {salvo && (
            <span className="inline-flex items-center gap-1 text-[13px] text-ok">
              <Check size={15} /> Salvo
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
