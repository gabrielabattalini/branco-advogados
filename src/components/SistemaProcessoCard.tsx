"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Save, Loader2, Check, Server } from "lucide-react";
import { atualizarSistemaProcesso } from "@/lib/actions";

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[11px] text-faint";

export function SistemaProcessoCard({
  id,
  sistema,
  linkSistema,
}: {
  id: string;
  sistema: string;
  linkSistema: string;
}) {
  const router = useRouter();
  const [sis, setSis] = useState(sistema);
  const [link, setLink] = useState(linkSistema);
  const [editando, setEditando] = useState(!sistema && !linkSistema);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const salvar = async () => {
    setSalvando(true);
    const res = await atualizarSistemaProcesso(id, sis, link);
    setSalvando(false);
    if (res.ok) {
      setSalvo(true);
      setEditando(false);
      router.refresh();
    } else alert(res.erro);
  };

  return (
    <div className="mb-3 rounded-lg border border-line bg-surface p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-[15px] font-medium text-navy">
          <Server size={16} /> Sistema onde tramita
        </h2>
        {!editando && (
          <button
            onClick={() => setEditando(true)}
            className="rounded-md border border-line px-2.5 py-1 text-[12px] text-muted hover:bg-cream"
          >
            Editar
          </button>
        )}
      </div>

      {!editando ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[13px] text-ink">
            {sis ? sis : <span className="text-faint">Sistema não informado</span>}
          </span>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-navy/40 px-3 py-1.5 text-[12px] text-navy hover:bg-cream"
            >
              <ExternalLink size={13} /> Abrir no sistema
            </a>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-[160px_1fr] gap-3">
            <div>
              <label className={labelCls}>Sistema</label>
              <input
                className={inputCls}
                list="sistemas-lista-ficha"
                value={sis}
                onChange={(e) => setSis(e.target.value)}
                placeholder="PJe, e-SAJ…"
              />
              <datalist id="sistemas-lista-ficha">
                <option value="PJe" />
                <option value="e-SAJ" />
                <option value="Projudi" />
                <option value="EPROC" />
                <option value="PJe-JT" />
                <option value="Creta" />
                <option value="Físico" />
              </datalist>
            </div>
            <div>
              <label className={labelCls}>Link do processo</label>
              <input
                className={inputCls}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={salvar}
              disabled={salvando}
              className="inline-flex items-center gap-2 rounded-md bg-navy px-4 py-2 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
            >
              {salvando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {salvando ? "Salvando…" : "Salvar"}
            </button>
            {salvo && <span className="inline-flex items-center gap-1 text-[13px] text-ok"><Check size={15} /> Salvo</span>}
          </div>
        </div>
      )}
    </div>
  );
}
