"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Search, History } from "lucide-react";
import { Modal } from "@/components/Modal";
import { AreaTag } from "@/components/AreaTag";
import {
  classificarArea,
  STATUS_LIST,
  type Processo,
  type TarefaFull,
} from "@/lib/mock";
import { ehGestor } from "@/lib/papeis";
import { hojeISO, addDiasISO } from "@/lib/hoje";
import {
  somarDiasUteis,
  somarDiasCorridos,
  diaUtilAnterior,
} from "@/lib/diasUteis";
import type { Responsavel } from "@/lib/data";
import { criarTarefa, editarTarefa, excluirTarefa } from "@/lib/actions";
import { criarTarefaPublicacao } from "@/lib/aasp-actions";
import { TarefaTimeline } from "@/components/TarefaTimeline";

// Pré-carregamento ao abrir o modal a partir da Triagem.
export type InicialTarefa = {
  titulo?: string;
  processoNumero?: string;
  responsaveis?: string[];
  dataDisponibilizacao?: string;
  dataPublicacao?: string;
  prazoDias?: number;
  prazoTipo?: string;
};

const inputCls =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60";
const labelCls = "mb-1 block text-[12px] text-muted";

export function NovaTarefaModal({
  processos,
  responsaveis,
  ultimosResp,
  tarefa,
  inicial,
  triagemPublicacaoId,
  papel,
  me,
  onClose,
}: {
  processos: Processo[];
  responsaveis: Responsavel[];
  ultimosResp: Record<string, string[]>;
  tarefa?: TarefaFull;
  inicial?: InicialTarefa;
  triagemPublicacaoId?: string;
  papel: string;
  me?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const edicao = !!tarefa;
  const coord = ehGestor(papel);
  const [titulo, setTitulo] = useState(tarefa?.titulo ?? inicial?.titulo ?? "");
  const [descricao, setDescricao] = useState(tarefa?.descricao ?? "");
  const [numero, setNumero] = useState(
    tarefa?.processo ?? inicial?.processoNumero ?? "",
  );
  const [procBusca, setProcBusca] = useState("");
  const [procAberto, setProcAberto] = useState(false);
  const [resps, setResps] = useState<string[]>(
    tarefa?.responsaveis ?? inicial?.responsaveis ?? (me ? [me] : []),
  );
  const [status, setStatus] = useState<string>(tarefa?.status ?? "a_fazer");

  // Solicitante (cível: Débora · trab.: Karen) e Revisor (cível: Mauro · trab.:
  // Karen) — padrão por área, achados pelo nome na equipe; editáveis.
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const acharPor = (alvo: string) =>
    responsaveis.find((r) => norm(r.nome).startsWith(alvo))?.iniciais ?? "";
  const solicitanteDe = (a: string) =>
    acharPor(a === "trabalhista" ? "karen" : "debora");
  const revisorDe = (a: string) =>
    acharPor(a === "trabalhista" ? "karen" : "mauro");

  // Prazo (CPC 224): a disponibilização (saída no DJe) costuma ser hoje; a
  // publicação é o 1º dia útil seguinte e é a base da contagem. Em EDIÇÃO ou
  // pré-carregamento (Triagem) preservamos o que veio.
  const dispInicial = edicao
    ? (tarefa?.dataDisponibilizacao ?? "")
    : inicial?.dataDisponibilizacao || hojeISO();
  const pubInicial = edicao
    ? (tarefa?.dataPublicacao ?? "")
    : inicial?.dataPublicacao || somarDiasUteis(dispInicial, 1);
  const prazoDiasInic = tarefa?.prazoDias ?? inicial?.prazoDias ?? 5;
  const prazoTipoInic: "uteis" | "corridos" =
    (tarefa?.prazoTipo ?? inicial?.prazoTipo) === "corridos"
      ? "corridos"
      : "uteis";
  const [dataDisp, setDataDisp] = useState(dispInicial);
  const [dataPub, setDataPub] = useState(pubInicial);
  const [prazoDias, setPrazoDias] = useState<number>(prazoDiasInic);
  const [prazoTipo, setPrazoTipo] = useState<"uteis" | "corridos">(prazoTipoInic);
  const [dataFinal, setDataFinal] = useState(
    tarefa?.data ??
      (() => {
        const n = Math.max(1, prazoDiasInic - 1); // margem de 1 dia
        return prazoTipoInic === "corridos"
          ? diaUtilAnterior(addDiasISO(pubInicial, n))
          : somarDiasUteis(pubInicial, n);
      })(),
  );
  // Marca quando publicação/data fatal foram ajustadas à mão, para não
  // sobrescrevê-las silenciosamente ao mexer num campo "acima".
  const [pubManual, setPubManual] = useState(edicao && !!tarefa?.dataPublicacao);
  const [finalManual, setFinalManual] = useState(edicao);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const area = numero ? classificarArea(numero) : "civel";
  const [solicitante, setSolicitante] = useState(
    tarefa?.solicitante || solicitanteDe(area),
  );
  const [revisor, setRevisor] = useState(tarefa?.revisor || revisorDe(area));
  const [solManual, setSolManual] = useState(false);
  const [revManual, setRevManual] = useState(false);
  // Trocar o processo muda a área → atualiza os padrões (se não escolhidos à mão).
  useEffect(() => {
    if (!edicao && !solManual) setSolicitante(solicitanteDe(area));
    if (!edicao && !revManual) setRevisor(revisorDe(area));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area]);
  // Sugestão: responsáveis da última tarefa deste processo (só os atribuíveis).
  const sugestao = numero
    ? (ultimosResp[numero] ?? []).filter((i) =>
        responsaveis.some((r) => r.iniciais === i),
      )
    : [];
  const nomesSugeridos = sugestao
    .map((i) => {
      const r = responsaveis.find((x) => x.iniciais === i);
      return (r?.nome ?? i).split(/\s+/)[0];
    })
    .join(" / ");
  const procSel = processos.find((p) => p.numero === numero);
  const q = procBusca.trim().toLowerCase();
  const qd = q.replace(/\D/g, "");
  const procFiltrados = (
    q
      ? processos.filter(
          (p) =>
            p.cliente.toLowerCase().includes(q) ||
            p.numero.toLowerCase().includes(q) ||
            (qd.length > 0 && p.numero.replace(/\D/g, "").includes(qd)),
        )
      : processos
  ).slice(0, 8);

  // Vencimento LEGAL (o prazo que a lei/juiz concede), a partir da publicação.
  const calcFinal = (pub: string, dias: number, tipo: "uteis" | "corridos") =>
    tipo === "uteis" ? somarDiasUteis(pub, dias) : somarDiasCorridos(pub, dias);
  // Nossa DATA FATAL = vencimento − 1 dia de margem, antecipando para o dia
  // útil anterior quando cair em fim de semana/feriado.
  const calcFatal = (pub: string, dias: number, tipo: "uteis" | "corridos") => {
    if (!pub) return "";
    const n = Math.max(1, dias - 1);
    return tipo === "uteis"
      ? somarDiasUteis(pub, n)
      : diaUtilAnterior(addDiasISO(pub, n));
  };

  // Mudar a disponibilização reposiciona a publicação (1º dia útil seguinte)
  // — salvo se ela foi ajustada à mão — e então a data fatal.
  const onDisp = (v: string) => {
    setDataDisp(v);
    const np = pubManual ? dataPub : v ? somarDiasUteis(v, 1) : "";
    if (!pubManual) setDataPub(np);
    if (!finalManual) setDataFinal(calcFatal(np, prazoDias, prazoTipo));
  };
  const onPub = (v: string) => {
    setDataPub(v);
    setPubManual(true);
    if (!finalManual) setDataFinal(calcFatal(v, prazoDias, prazoTipo));
  };
  const onDias = (n: number) => {
    setPrazoDias(n);
    setFinalManual(false);
    setDataFinal(calcFatal(dataPub, n, prazoTipo));
  };
  const onTipo = (t: "uteis" | "corridos") => {
    setPrazoTipo(t);
    setFinalManual(false);
    setDataFinal(calcFatal(dataPub, prazoDias, t));
  };
  const onFinal = (v: string) => {
    setDataFinal(v);
    setFinalManual(true);
  };
  const inicioContagem = dataPub ? somarDiasUteis(dataPub, 1) : "";
  const vencimentoLegal = dataPub
    ? calcFinal(dataPub, prazoDias, prazoTipo)
    : "";
  const dataFinalValida = /^\d{4}-\d{2}-\d{2}$/.test(dataFinal);
  const brL = (iso: string) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  const toggleResp = (ini: string) =>
    setResps((rs) =>
      rs.includes(ini) ? rs.filter((x) => x !== ini) : [...rs, ini],
    );

  const submit = async () => {
    if (!titulo.trim() || salvando) return;
    if (!dataFinalValida) {
      setErro("Informe a data final do prazo (data fatal).");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const [, mm, dd] = dataFinal.split("-");
      const prazo = `${dd}/${mm}`;
      const comuns = {
        titulo: titulo.trim(),
        descricao,
        processoNumero: numero,
        data: dataFinal,
        dataDisponibilizacao: dataDisp,
        dataPublicacao: dataPub,
        prazoDias,
        prazoTipo,
        prazo,
        responsaveis: resps,
        solicitante,
        revisor,
      };
      const res = edicao
        ? await editarTarefa({ id: tarefa!.id, status, ...comuns })
        : triagemPublicacaoId
          ? await criarTarefaPublicacao({
              publicacaoId: triagemPublicacaoId,
              area,
              ...comuns,
            })
          : await criarTarefa({ area, ...comuns });
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
    if (!tarefa || salvando) return;
    if (!confirm("Excluir esta tarefa? Esta ação não pode ser desfeita.")) return;
    setSalvando(true);
    setErro("");
    const res = await excluirTarefa(tarefa.id);
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
      titulo={edicao ? "Editar tarefa" : "Nova tarefa"}
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between">
          <div>
            {edicao && coord && (
              <button
                onClick={excluir}
                disabled={salvando}
                className="text-[13px] text-danger hover:underline disabled:opacity-40"
              >
                Excluir tarefa
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
              disabled={!titulo.trim() || !dataFinalValida || salvando}
              className="rounded-md bg-navy px-3 py-1.5 text-sm text-cream hover:bg-navy-dark disabled:opacity-40"
            >
              {salvando ? "Salvando…" : edicao ? "Salvar" : "Criar tarefa"}
            </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className={labelCls}>Título da tarefa</label>
          <input
            className={inputCls}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Elaborar contestação"
            autoFocus
          />
        </div>
        <div>
          <label className={labelCls}>Descrição curta</label>
          <textarea
            className={inputCls + " resize-none"}
            rows={2}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Um resumo do que precisa ser feito (opcional)"
          />
        </div>
        <div>
          <label className={labelCls}>Responsáveis (uma ou mais pessoas)</label>
          <div className="flex flex-col gap-2.5">
            {[
              { area: "civel", titulo: "Cível" },
              { area: "trabalhista", titulo: "Trabalhista" },
            ].map((grupo) => {
              const pessoas = responsaveis.filter((r) =>
                grupo.area === "trabalhista"
                  ? r.area === "trabalhista"
                  : r.area !== "trabalhista",
              );
              if (pessoas.length === 0) return null;
              return (
                <div key={grupo.area}>
                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-faint">
                    {grupo.titulo}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pessoas.map((r) => {
                      const sel = resps.includes(r.iniciais);
                      return (
                        <button
                          type="button"
                          key={r.iniciais}
                          onClick={() => toggleResp(r.iniciais)}
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
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Solicitante</label>
            <select
              className={inputCls}
              value={solicitante}
              onChange={(e) => {
                setSolicitante(e.target.value);
                setSolManual(true);
              }}
            >
              <option value="">—</option>
              {responsaveis.map((r) => (
                <option key={r.iniciais} value={r.iniciais}>
                  {r.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Revisor</label>
            <select
              className={inputCls}
              value={revisor}
              onChange={(e) => {
                setRevisor(e.target.value);
                setRevManual(true);
              }}
            >
              <option value="">—</option>
              {responsaveis.map((r) => (
                <option key={r.iniciais} value={r.iniciais}>
                  {r.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Processo vinculado — busca por nome ou número */}
        <div>
          <label className={labelCls}>Processo vinculado</label>
          <div className="relative">
            <div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 focus-within:border-navy/60">
              <Search size={15} className="shrink-0 text-faint" />
              <input
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
                value={
                  procAberto
                    ? procBusca
                    : procSel
                      ? `${procSel.numero} — ${procSel.cliente}`
                      : numero
                }
                onChange={(e) => {
                  setProcBusca(e.target.value);
                  setProcAberto(true);
                }}
                onFocus={() => {
                  setProcAberto(true);
                  setProcBusca("");
                }}
                onBlur={() => setTimeout(() => setProcAberto(false), 150)}
                placeholder="Buscar por nome ou número do processo…"
              />
              {numero && !procAberto && (
                <button
                  type="button"
                  onClick={() => setNumero("")}
                  className="shrink-0 text-[12px] text-faint hover:text-muted"
                >
                  limpar
                </button>
              )}
            </div>
            {procAberto && (
              <div className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-auto rounded-md border border-line bg-surface shadow-lg">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setNumero("");
                    setProcAberto(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-[12px] text-muted hover:bg-cream"
                >
                  — Sem processo —
                </button>
                {procFiltrados.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setNumero(p.numero);
                      setProcAberto(false);
                    }}
                    className="block w-full border-t border-line px-3 py-2 text-left hover:bg-cream"
                  >
                    <span className="font-mono text-[12px] text-ink">
                      {p.numero}
                    </span>
                    <span className="text-[12px] text-muted"> — {p.cliente}</span>
                  </button>
                ))}
                {procFiltrados.length === 0 && (
                  <div className="px-3 py-2 text-[12px] text-faint">
                    Nenhum processo encontrado.
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[12px] text-muted">
            Área {numero ? "detectada" : "padrão"}: <AreaTag area={area} />
          </div>
          {numero && sugestao.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-gold/10 px-2.5 py-1.5 text-[12px]">
              <History size={13} className="shrink-0 text-gold" />
              <span className="text-muted">
                Últimas tarefas deste processo:
              </span>
              <span className="font-medium text-navy">{nomesSugeridos}</span>
              <button
                type="button"
                onClick={() => setResps(sugestao)}
                className="ml-auto shrink-0 rounded border border-gold/50 px-2 py-0.5 text-[11px] font-medium text-navy hover:bg-gold/20"
              >
                Usar
              </button>
            </div>
          )}
        </div>

        {/* Prazo — disponibilização + publicação (CPC 224) */}
        <div>
          <label className={labelCls}>Prazo</label>
          {coord ? (
            <div className="flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] text-faint">
                    Data da disponibilização
                  </label>
                  <input
                    type="date"
                    className={inputCls}
                    value={dataDisp}
                    onChange={(e) => onDisp(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-faint">
                    Data da publicação
                  </label>
                  <input
                    type="date"
                    className={inputCls}
                    value={dataPub}
                    onChange={(e) => onPub(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="mb-1 block text-[11px] text-faint">
                    Prazo
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-20 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-navy/60"
                    value={prazoDias}
                    onChange={(e) => onDias(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-faint">
                    Tipo
                  </label>
                  <select
                    className={inputCls}
                    value={prazoTipo}
                    onChange={(e) =>
                      onTipo(e.target.value as "uteis" | "corridos")
                    }
                  >
                    <option value="uteis">dias úteis</option>
                    <option value="corridos">dias corridos</option>
                  </select>
                </div>
              </div>
              <p className="rounded-md bg-navy/5 px-2.5 py-1.5 text-[11px] leading-relaxed text-muted">
                A <strong className="font-medium text-navy">publicação</strong> é
                o 1º dia útil após a disponibilização e é de onde o prazo conta
                (CPC, art. 224). Início:{" "}
                <strong className="font-medium text-navy">
                  {brL(inicioContagem)}
                </strong>{" "}
                · Vencimento legal:{" "}
                <strong className="font-medium text-navy">
                  {brL(vencimentoLegal)}
                </strong>{" "}
                · a data fatal abaixo já vem com a{" "}
                <strong className="font-medium text-gold">margem de 1 dia</strong>{" "}
                do escritório.
              </p>
              <div>
                <label className="mb-1 block text-[11px] text-faint">
                  Data fatal do escritório (vencimento legal − 1 dia)
                </label>
                <input
                  type="date"
                  className={
                    inputCls +
                    (dataFinalValida ? "" : " border-danger focus:border-danger")
                  }
                  value={dataFinal}
                  onChange={(e) => onFinal(e.target.value)}
                />
                {!dataFinalValida && (
                  <p className="mt-1 text-[11px] text-danger">
                    Informe a data final do prazo.
                  </p>
                )}
                <p className="mt-1 text-[11px] text-faint">
                  É preenchida pelo cálculo acima, mas você pode ajustar a data
                  direto no calendário. Dias úteis descontam fins de semana e
                  feriados nacionais; em dias corridos, vencimento que cai em dia
                  não útil é prorrogado para o próximo dia útil. Feriados locais e
                  o recesso forense (20/12–20/01) não são considerados — confira
                  nesses casos.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
                <span>
                  Disponibilização:{" "}
                  <strong className="font-medium text-ink">
                    {brL(dataDisp)}
                  </strong>
                </span>
                <span>
                  Publicação:{" "}
                  <strong className="font-medium text-ink">
                    {brL(dataPub)}
                  </strong>
                </span>
              </div>
              <input
                type="date"
                disabled
                readOnly
                className={inputCls + " cursor-not-allowed opacity-60"}
                value={dataFinal}
              />
              <p className="text-[11px] text-faint">
                Só o coordenador pode definir o prazo.
              </p>
            </div>
          )}
        </div>

        {edicao && (
          <div>
            <label className={labelCls}>Status</label>
            <select
              className={inputCls}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_LIST.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {erro && <p className="text-[12px] text-danger">{erro}</p>}

        {edicao && tarefa && <TarefaTimeline tarefaId={tarefa.id} />}
      </div>
    </Modal>
  );
}
