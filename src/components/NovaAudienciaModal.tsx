"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Bell, X, Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import {
  TIPOS_AUDIENCIA,
  PRESETS_LEMBRETE,
  formatOffset,
  paraMinutos,
} from "@/lib/audiencia";
import { ehGestor } from "@/lib/papeis";
import type { Processo } from "@/lib/mock";
import type { Responsavel, AudienciaDTO } from "@/lib/data";
import {
  criarAudiencia,
  editarAudiencia,
  excluirAudiencia,
} from "@/lib/actions";

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[12px] text-muted";
const MAX = 30 * 1440;

export function NovaAudienciaModal({
  processos,
  responsaveis,
  audiencia,
  papel,
  me,
  onClose,
}: {
  processos: Processo[];
  responsaveis: Responsavel[];
  audiencia?: AudienciaDTO;
  papel: string;
  me?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const edicao = !!audiencia;
  const gestor = ehGestor(papel);

  const [titulo, setTitulo] = useState(audiencia?.titulo ?? "");
  const [numero, setNumero] = useState(audiencia?.processoNumero ?? "");
  const [data, setData] = useState(audiencia?.data ?? "");
  const [hora, setHora] = useState(audiencia?.hora ?? "09:00");
  const [tipo, setTipo] = useState(audiencia?.tipo ?? "instrucao");
  const [local, setLocal] = useState(audiencia?.local ?? "");
  const [partes, setPartes] = useState(audiencia?.partes ?? "");
  const [observacoes, setObservacoes] = useState(audiencia?.observacoes ?? "");
  const [status, setStatus] = useState(audiencia?.status ?? "agendada");
  const [modalidade, setModalidade] = useState(
    audiencia?.modalidade ?? "presencial",
  );
  const [link, setLink] = useState(audiencia?.link ?? "");
  const [parts, setParts] = useState<string[]>(
    audiencia?.participantes ?? (me ? [me] : []),
  );
  const [lembretes, setLembretes] = useState<number[]>(
    audiencia?.lembretes.map((l) => l.offsetMin) ?? [1440, 60],
  );
  const [valor, setValor] = useState(30);
  const [unidade, setUnidade] = useState<"min" | "h" | "d">("min");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const toggleParte = (ini: string) =>
    setParts((p) =>
      p.includes(ini) ? p.filter((x) => x !== ini) : [...p, ini],
    );
  const addLembrete = (min: number) =>
    setLembretes((ls) =>
      ls.includes(min) ? ls : [...ls, min].sort((a, b) => b - a),
    );
  const removeLembrete = (min: number) =>
    setLembretes((ls) => ls.filter((x) => x !== min));
  const addCustom = () => {
    const m = paraMinutos(Math.max(1, Math.floor(valor || 0)), unidade);
    if (m > 0 && m <= MAX) addLembrete(m);
  };

  const pill = (ativo: boolean) =>
    "rounded-md px-3 py-1.5 text-[12px] transition-colors " +
    (ativo
      ? "bg-navy text-cream"
      : "border border-line text-muted hover:bg-surface");

  const valido = !!titulo.trim() && !!data && !!hora;

  const submit = async () => {
    if (!valido || salvando) return;
    setSalvando(true);
    setErro("");
    const base = {
      processoNumero: numero,
      titulo: titulo.trim(),
      data,
      hora,
      tipo,
      modalidade,
      link,
      local,
      partes,
      participantes: parts,
      observacoes,
      lembretes,
    };
    try {
      const res = edicao
        ? await editarAudiencia({ ...base, id: audiencia!.id, status })
        : await criarAudiencia(base);
      if (res.ok) {
        router.refresh();
        onClose();
        return;
      }
      setErro(res.erro);
    } catch {
      setErro("Erro inesperado ao salvar.");
    }
    setSalvando(false);
  };

  const excluir = async () => {
    if (!audiencia || salvando) return;
    if (!confirm("Excluir esta audiência? Esta ação não pode ser desfeita."))
      return;
    setSalvando(true);
    setErro("");
    const res = await excluirAudiencia(audiencia.id);
    if (res.ok) {
      router.refresh();
      onClose();
      return;
    }
    setErro(res.erro);
    setSalvando(false);
  };

  const presetsDisponiveis = PRESETS_LEMBRETE.filter(
    (p) => !lembretes.includes(p.min),
  );

  return (
    <Modal
      titulo={edicao ? "Editar audiência" : "Nova audiência"}
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between">
          <div>
            {edicao && (gestor || (me && audiencia!.participantes.includes(me))) && (
              <button
                onClick={excluir}
                disabled={salvando}
                className="text-[13px] text-danger hover:underline disabled:opacity-40"
              >
                Excluir
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:bg-surface"
            >
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={!valido || salvando}
              className="rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
            >
              {salvando ? "Salvando…" : edicao ? "Salvar" : "Criar audiência"}
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className={labelCls}>Título</label>
          <input
            className={inputCls}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Audiência de instrução — João da Silva"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Data</label>
            <input
              type="date"
              className={inputCls}
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Horário</label>
            <input
              type="time"
              className={inputCls}
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Tipo</label>
            <select
              className={inputCls}
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              {TIPOS_AUDIENCIA.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Processo (opcional)</label>
            <select
              className={inputCls}
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            >
              <option value="">— Sem processo —</option>
              {processos.map((p) => (
                <option key={p.id} value={p.numero}>
                  {p.numero} — {p.cliente}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Modalidade</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setModalidade("presencial")}
              className={pill(modalidade === "presencial")}
            >
              Presencial
            </button>
            <button
              type="button"
              onClick={() => setModalidade("virtual")}
              className={pill(modalidade === "virtual")}
            >
              Virtual
            </button>
          </div>
          {modalidade === "virtual" && (
            <input
              className={inputCls + " mt-2"}
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Link da sala (https://…)"
            />
          )}
        </div>

        <div>
          <label className={labelCls}>
            {modalidade === "virtual" ? "Vara / órgão" : "Vara / local"}
          </label>
          <input
            className={inputCls}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            placeholder="Ex.: TRT15 · 2ª Vara do Trabalho de Jundiaí"
          />
        </div>
        <div>
          <label className={labelCls}>Partes</label>
          <input
            className={inputCls}
            value={partes}
            onChange={(e) => setPartes(e.target.value)}
            placeholder="Ex.: João da Silva × Indústria Zardetto"
          />
        </div>

        <div>
          <label className={labelCls}>Participantes</label>
          <div className="flex flex-wrap gap-2">
            {responsaveis.map((r) => {
              const sel = parts.includes(r.iniciais);
              return (
                <button
                  type="button"
                  key={r.iniciais}
                  onClick={() => toggleParte(r.iniciais)}
                  className={
                    "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] " +
                    (sel
                      ? "border-navy bg-navy/10 text-navy"
                      : "border-line text-muted hover:bg-surface")
                  }
                >
                  {sel && <Check size={12} />}
                  {r.nome}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lembretes */}
        <div className="rounded-md border border-line bg-cream/50 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-navy">
            <Bell size={13} /> Lembretes por e-mail e Telegram (antes da audiência)
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {lembretes.length === 0 && (
              <span className="text-[12px] text-faint">
                Nenhum lembrete — adicione abaixo.
              </span>
            )}
            {lembretes.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 rounded-full bg-navy/10 px-2.5 py-1 text-[11.5px] text-navy"
              >
                {formatOffset(m)}
                <button
                  type="button"
                  onClick={() => removeLembrete(m)}
                  aria-label="Remover lembrete"
                  className="text-navy/60 hover:text-danger"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          {presetsDisponiveis.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {presetsDisponiveis.map((p) => (
                <button
                  type="button"
                  key={p.min}
                  onClick={() => addLembrete(p.min)}
                  className="rounded-md border border-line px-2 py-0.5 text-[11px] text-muted hover:bg-surface"
                >
                  + {p.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <div>
              <label className="mb-1 block text-[11px] text-faint">
                Personalizado
              </label>
              <input
                type="number"
                min={1}
                value={valor}
                onChange={(e) => setValor(Number(e.target.value))}
                className="w-20 rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink outline-none"
              />
            </div>
            <select
              value={unidade}
              onChange={(e) =>
                setUnidade(e.target.value as "min" | "h" | "d")
              }
              className="rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink outline-none"
            >
              <option value="min">minutos antes</option>
              <option value="h">horas antes</option>
              <option value="d">dias antes</option>
            </select>
            <button
              type="button"
              onClick={addCustom}
              className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-[12px] text-navy hover:bg-surface"
            >
              <Plus size={13} /> Adicionar
            </button>
          </div>
        </div>

        <div>
          <label className={labelCls}>Observações</label>
          <textarea
            className={inputCls + " resize-none"}
            rows={2}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Anotações (opcional)"
          />
        </div>

        {edicao && (
          <div>
            <label className={labelCls}>Situação</label>
            <select
              className={inputCls}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="agendada">Agendada</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        )}

        {erro && <p className="text-[12px] text-danger">{erro}</p>}
      </div>
    </Modal>
  );
}
