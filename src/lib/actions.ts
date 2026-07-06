"use server";

import { Prisma } from "@prisma/client";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { STATUS_LIST, statusLabel } from "@/lib/mock";
import { getSessao, ehGestor } from "@/lib/sessao";
import { instanteBRT } from "@/lib/audiencia";
import { hojeISO, hojeBR } from "@/lib/hoje";
import { avisarPorIniciais } from "@/lib/telegram-notify";
import { escT } from "@/lib/telegram";

const TIPOS_AUDIENCIA = ["instrucao", "conciliacao", "inicial", "una", "outra"];
const STATUS_AUDIENCIA = ["agendada", "realizada", "cancelada"];
const MAX_OFFSET = 30 * 1440; // 30 dias em minutos

function limparOffsets(lembretes: number[] | undefined): number[] {
  return [
    ...new Set(
      (lembretes ?? []).filter(
        (m) => Number.isInteger(m) && m > 0 && m <= MAX_OFFSET,
      ),
    ),
  ];
}

export type ActionResult = { ok: true } | { ok: false; erro: string };

// Registra um item na linha do tempo da tarefa (comentário ou mudança).
// Nunca derruba a operação principal: falha de log é silenciosa.
async function registrarHistorico(
  tarefaId: string,
  autor: string,
  tipo: string,
  texto: string,
): Promise<void> {
  try {
    await prisma.tarefaHistorico.create({
      data: { tarefaId, autor, tipo, texto: texto.slice(0, 2000) },
    });
  } catch {
    /* histórico é secundário — não interrompe a ação */
  }
}

// Aceita só "yyyy-mm-dd"; qualquer outra coisa vira "" (campo opcional).
function isoOuVazio(v: string | undefined): string {
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
}

function prazoDiasOk(n: number | undefined): number {
  return Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 999
    ? (n as number)
    : 5;
}
function prazoTipoOk(t: string | undefined): string {
  return t === "corridos" ? "corridos" : "uteis";
}

const AREAS = ["trabalhista", "civel"];
const STATUSES = STATUS_LIST.map((s) => s.key as string);

function labelStatus(k: string): string {
  return (statusLabel as Record<string, string>)[k] ?? k;
}

// Iniciais válidas = usuários ativos no banco (equipe atual).
async function iniciaisValidas(): Promise<Set<string>> {
  const us = await prisma.usuario.findMany({
    where: { ativo: true },
    select: { iniciais: true },
  });
  return new Set(us.map((u) => u.iniciais));
}

export async function criarTarefa(input: {
  titulo: string;
  descricao: string;
  processoNumero: string;
  area: string;
  data: string;
  dataDisponibilizacao: string;
  dataPublicacao: string;
  prazoDias: number;
  prazoTipo: string;
  prazo: string;
  responsaveis: string[];
  solicitante?: string;
  revisor?: string;
  origem?: string;
}): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  const titulo = input.titulo.trim().slice(0, 200);
  if (!titulo) return { ok: false, erro: "Informe o título da tarefa." };
  const area = AREAS.includes(input.area) ? input.area : "civel";
  try {
    const validas = await iniciaisValidas();
    const resp = (input.responsaveis ?? []).filter((r) => validas.has(r));
    const resps = resp.length ? resp : [s.iniciais];
    const processo = input.processoNumero
      ? await prisma.processo.findUnique({
          where: { numero: input.processoNumero },
        })
      : null;
    const nova = await prisma.tarefa.create({
      data: {
        titulo,
        descricao: input.descricao?.trim().slice(0, 5000) || null,
        processoId: processo?.id ?? null,
        area,
        data: isoOuVazio(input.data) || hojeISO(),
        dataDisponibilizacao: isoOuVazio(input.dataDisponibilizacao),
        dataPublicacao: isoOuVazio(input.dataPublicacao),
        prazoDias: prazoDiasOk(input.prazoDias),
        prazoTipo: prazoTipoOk(input.prazoTipo),
        prazo: (input.prazo || "").slice(0, 12),
        status: "a_fazer",
        responsaveis: resps,
        solicitante: validas.has(input.solicitante ?? "") ? input.solicitante! : "",
        revisor: validas.has(input.revisor ?? "") ? input.revisor! : "",
        origem: input.origem === "aasp" ? "aasp" : "manual",
      },
    });
    await registrarHistorico(nova.id, s.iniciais, "criacao", "criou a tarefa");
    // Avisa no Telegram quem foi atribuído (menos quem criou).
    const avisar = resps.filter((r) => r !== s.iniciais);
    if (avisar.length)
      await avisarPorIniciais(
        avisar,
        `📋 <b>Nova tarefa</b>\n${escT(titulo)}\nPrazo: ${escT(
          input.prazo || "—",
        )}${processo ? `\nProcesso: ${escT(processo.numero)}` : ""}`,
      );
    revalidatePath("/tarefas");
    revalidatePath("/painel");
    revalidatePath("/processos");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível criar a tarefa." };
  }
}

export async function atualizarStatusTarefa(
  id: string,
  status: string,
): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  if (!STATUSES.includes(status)) return { ok: false, erro: "Status inválido." };
  try {
    const tarefa = await prisma.tarefa.findUnique({
      where: { id },
      select: { responsaveis: true, status: true },
    });
    if (!tarefa) return { ok: false, erro: "Tarefa não encontrada." };
    if (!ehGestor(s.papel) && !tarefa.responsaveis.includes(s.iniciais))
      return { ok: false, erro: "Sem permissão para esta tarefa." };
    await prisma.tarefa.update({
      where: { id },
      // Carimba a conclusão (base dos gráficos de produtividade); limpa se reabrir.
      data: { status, concluidaEm: status === "concluida" ? new Date() : null },
    });
    if (tarefa.status !== status)
      await registrarHistorico(
        id,
        s.iniciais,
        "status",
        `mudou o status: ${labelStatus(tarefa.status)} → ${labelStatus(status)}`,
      );
    revalidatePath("/tarefas");
    revalidatePath("/painel");
    revalidatePath("/carga");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível atualizar o status." };
  }
}

export async function editarTarefa(input: {
  id: string;
  titulo: string;
  descricao: string;
  processoNumero: string;
  status: string;
  data: string;
  dataDisponibilizacao: string;
  dataPublicacao: string;
  prazoDias: number;
  prazoTipo: string;
  prazo: string;
  responsaveis: string[];
  solicitante?: string;
  revisor?: string;
}): Promise<ActionResult> {
  const titulo = input.titulo.trim();
  if (!titulo) return { ok: false, erro: "Informe o título da tarefa." };
  if (!STATUSES.includes(input.status))
    return { ok: false, erro: "Status inválido." };
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  const gestor = ehGestor(s.papel);
  try {
    const validas = await iniciaisValidas();
    const resp = (input.responsaveis ?? []).filter((r) => validas.has(r));
    const resps = resp.length ? resp : [s.iniciais];
    const alvo = await prisma.tarefa.findUnique({
      where: { id: input.id },
      select: { responsaveis: true, status: true, data: true, prazo: true },
    });
    if (!alvo) return { ok: false, erro: "Tarefa não encontrada." };
    // Só um gestor ou um responsável pela tarefa pode editá-la.
    if (!gestor && !alvo.responsaveis.includes(s.iniciais))
      return { ok: false, erro: "Sem permissão para editar esta tarefa." };
    const processo = input.processoNumero
      ? await prisma.processo.findUnique({
          where: { numero: input.processoNumero },
        })
      : null;
    const dataFatal = isoOuVazio(input.data) || hojeISO();
    const [, mm, dd] = dataFatal.split("-");
    await prisma.tarefa.update({
      where: { id: input.id },
      data: {
        titulo,
        descricao: input.descricao?.trim() || null,
        processoId: processo?.id ?? null,
        status: input.status,
        // Carimba a conclusão ao entrar em "concluida"; mantém a data se já
        // estava concluída (undefined = não altera); limpa se reabrir.
        concluidaEm:
          input.status === "concluida"
            ? alvo.status === "concluida"
              ? undefined
              : new Date()
            : null,
        responsaveis: resps,
        // Prazo/datas só um gestor pode alterar.
        ...(gestor
          ? {
              data: dataFatal,
              dataDisponibilizacao: isoOuVazio(input.dataDisponibilizacao),
              dataPublicacao: isoOuVazio(input.dataPublicacao),
              prazoDias: prazoDiasOk(input.prazoDias),
              prazoTipo: prazoTipoOk(input.prazoTipo),
              prazo: input.prazo || `${dd}/${mm}`,
              solicitante: validas.has(input.solicitante ?? "")
                ? input.solicitante!
                : "",
              revisor: validas.has(input.revisor ?? "") ? input.revisor! : "",
            }
          : {}),
      },
    });
    // Registra na linha do tempo o que de fato mudou.
    if (alvo.status !== input.status)
      await registrarHistorico(
        input.id,
        s.iniciais,
        "status",
        `mudou o status: ${labelStatus(alvo.status)} → ${labelStatus(input.status)}`,
      );
    const antes = [...alvo.responsaveis].sort().join(",");
    const depois = [...resps].sort().join(",");
    if (antes !== depois) {
      await registrarHistorico(
        input.id,
        s.iniciais,
        "responsaveis",
        `alterou os responsáveis: ${resps.join(" / ") || "—"}`,
      );
      // Avisa no Telegram quem passou a ser responsável agora (menos o autor).
      const novos = resps.filter(
        (r) => !alvo.responsaveis.includes(r) && r !== s.iniciais,
      );
      if (novos.length)
        await avisarPorIniciais(
          novos,
          `📋 <b>Você entrou numa tarefa</b>\n${escT(titulo)}\nPrazo: ${escT(
            input.prazo || "—",
          )}`,
        );
    }
    if (gestor && alvo.data !== dataFatal)
      await registrarHistorico(
        input.id,
        s.iniciais,
        "prazo",
        `alterou a data fatal para ${input.prazo || dataFatal}`,
      );
    revalidatePath("/tarefas");
    revalidatePath("/painel");
    revalidatePath("/processos");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível salvar a tarefa." };
  }
}

// Adiciona um comentário livre à tarefa. Qualquer pessoa com acesso à tarefa
// (gestor ou responsável) pode comentar.
export async function comentarTarefa(
  tarefaId: string,
  texto: string,
): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  const t = (texto ?? "").trim();
  if (!t) return { ok: false, erro: "Escreva um comentário." };
  try {
    const tarefa = await prisma.tarefa.findUnique({
      where: { id: tarefaId },
      select: { responsaveis: true },
    });
    if (!tarefa) return { ok: false, erro: "Tarefa não encontrada." };
    if (!ehGestor(s.papel) && !tarefa.responsaveis.includes(s.iniciais))
      return { ok: false, erro: "Sem permissão para comentar nesta tarefa." };
    await registrarHistorico(tarefaId, s.iniciais, "comentario", t);
    revalidatePath("/tarefas");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível salvar o comentário." };
  }
}

export type HistoricoItem = {
  id: string;
  autor: string; // iniciais
  autorNome: string;
  tipo: string;
  texto: string;
  quando: string; // ISO
};

// Linha do tempo completa da tarefa (comentários + mudanças), mais antiga → recente.
export async function getHistoricoTarefa(
  tarefaId: string,
): Promise<HistoricoItem[]> {
  const s = await getSessao();
  if (!s) return [];
  const tarefa = await prisma.tarefa.findUnique({
    where: { id: tarefaId },
    select: { responsaveis: true },
  });
  if (!tarefa) return [];
  if (!ehGestor(s.papel) && !tarefa.responsaveis.includes(s.iniciais)) return [];
  const rows = await prisma.tarefaHistorico.findMany({
    where: { tarefaId },
    orderBy: { criadoEm: "asc" },
    take: 200,
  });
  const inis = [...new Set(rows.map((r) => r.autor))];
  const nomes = new Map(
    (
      await prisma.usuario.findMany({
        where: { iniciais: { in: inis } },
        select: { iniciais: true, nome: true },
      })
    ).map((u) => [u.iniciais, u.nome]),
  );
  return rows.map((r) => ({
    id: r.id,
    autor: r.autor,
    autorNome: nomes.get(r.autor) ?? r.autor,
    tipo: r.tipo,
    texto: r.texto,
    quando: r.criadoEm.toISOString(),
  }));
}

export async function excluirTarefa(id: string): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  if (!ehGestor(s.papel))
    return { ok: false, erro: "Você não tem permissão para excluir tarefas." };
  try {
    await prisma.tarefa.delete({ where: { id } });
    revalidatePath("/tarefas");
    revalidatePath("/painel");
    revalidatePath("/processos");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível excluir a tarefa." };
  }
}

export async function criarEvento(input: {
  titulo: string;
  tipo: string;
  data: string;
  hora: string;
  detalhe: string;
  participantes: string[];
}): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  const titulo = input.titulo.trim();
  if (!titulo) return { ok: false, erro: "Informe o título do evento." };
  const tiposOk = ["reuniao", "audiencia", "prazo", "atendimento"];
  const tipo = tiposOk.includes(input.tipo) ? input.tipo : "reuniao";
  const data = /^\d{4}-\d{2}-\d{2}$/.test(input.data) ? input.data : hojeISO();
  try {
    const validas = await iniciaisValidas();
    const parts = (input.participantes ?? []).filter((r) => validas.has(r));
    await prisma.eventoAgenda.create({
      data: {
        titulo,
        tipo,
        data,
        hora: input.hora || "09:00",
        detalhe: input.detalhe?.trim() || "",
        participantes: parts,
      },
    });
    revalidatePath("/agenda");
    revalidatePath("/painel");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível criar o evento." };
  }
}

export async function salvarPerfil(input: {
  nome: string;
  area: string;
}): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  const nome = input.nome.trim();
  if (!nome) return { ok: false, erro: "Informe seu nome." };
  if (nome.length > 120) return { ok: false, erro: "Nome muito longo." };
  try {
    await prisma.usuario.update({
      where: { id: s.id },
      data: {
        nome,
        area: input.area === "trabalhista" ? "trabalhista" : "civel",
      },
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível salvar o perfil." };
  }
}

export async function criarProcesso(input: {
  numero: string;
  area: string;
  tribunal: string;
  cliente: string;
  parteContraria: string;
  responsavel: string;
  responsavelIniciais: string;
  valorCausa: string;
}): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  const numero = input.numero.trim();
  if (numero.replace(/\D/g, "").length < 14 || !input.cliente.trim()) {
    return { ok: false, erro: "Número (CNJ) e cliente são obrigatórios." };
  }
  const area = AREAS.includes(input.area) ? input.area : "civel";
  try {
    await prisma.processo.create({
      data: {
        numero,
        area,
        tribunal: input.tribunal.trim() || "—",
        status: "Em andamento",
        cliente: input.cliente.trim(),
        parteContraria: input.parteContraria.trim() || "—",
        responsavel: input.responsavel,
        responsavelIniciais: input.responsavelIniciais,
        valorCausa: input.valorCausa.trim() || "—",
        distribuido: hojeBR(),
        fase: "Conhecimento",
      },
    });
    revalidatePath("/processos");
    return { ok: true };
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false, erro: "Já existe um processo com esse número." };
    }
    return { ok: false, erro: "Não foi possível cadastrar o processo." };
  }
}

export async function gerarTarefaDaIntimacao(
  id: string,
): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // Lock otimista: só processa se ainda estiver pendente (idempotente).
      const lock = await tx.publicacao.updateMany({
        where: { id, statusTriagem: "pendente" },
        data: { statusTriagem: "processada" },
      });
      if (lock.count !== 1) return "ja_triada" as const;

      const pub = await tx.publicacao.findUnique({ where: { id } });
      if (!pub) return "nao_encontrada" as const;

      let processoId = pub.processoId;
      // Se o processo ainda não existe, cadastra a partir da intimação.
      if (!processoId) {
        const partes = pub.partes.split("×");
        const cliente = (partes[0] ?? "").trim() || "—";
        const parteContraria = (partes[1] ?? "").trim() || "—";
        const novo = await tx.processo.upsert({
          where: { numero: pub.numero },
          update: {},
          create: {
            numero: pub.numero,
            area: pub.area,
            tribunal: pub.tribunal,
            status: "Em andamento",
            cliente,
            parteContraria,
            responsavel: s.nome,
            responsavelIniciais: s.iniciais,
            valorCausa: "—",
            distribuido: hojeBR(),
            fase: "Conhecimento",
          },
        });
        processoId = novo.id;
        await tx.publicacao.update({
          where: { id },
          data: { processoId, processoCadastrado: true },
        });
      }

      await tx.tarefa.create({
        data: {
          titulo: pub.despacho.slice(0, 120),
          processoId,
          area: pub.area,
          data: hojeISO(),
          prazo: pub.prazo,
          status: "a_fazer",
          responsaveis: [s.iniciais],
          origem: "aasp",
        },
      });
      return "ok" as const;
    });

    if (resultado !== "ok") {
      return {
        ok: false,
        erro:
          resultado === "ja_triada"
            ? "Esta intimação já foi triada."
            : "Intimação não encontrada.",
      };
    }
    revalidatePath("/publicacoes");
    revalidatePath("/tarefas");
    revalidatePath("/painel");
    revalidatePath("/processos");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível gerar a tarefa." };
  }
}

const MAX_ARQUIVO = 20 * 1024 * 1024; // 20 MB

function armazenamentoConfigurado(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

// Anexa um documento (arquivo real) a um processo. O arquivo vai para o
// Vercel Blob; o registro guarda a URL (só no servidor) e é baixado por rota
// autenticada. Recebe FormData: processoNumero, nome, arquivo.
export async function anexarDocumento(
  formData: FormData,
): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  const processoNumero = String(formData.get("processoNumero") || "");
  const nomeRaw = String(formData.get("nome") || "").trim();
  const file = formData.get("arquivo");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, erro: "Selecione um arquivo para anexar." };
  if (file.size > MAX_ARQUIVO)
    return { ok: false, erro: "Arquivo muito grande (máximo 20 MB)." };
  const nome = (nomeRaw || file.name).slice(0, 255);
  if (!nome) return { ok: false, erro: "Informe o nome do documento." };
  if (!armazenamentoConfigurado())
    return {
      ok: false,
      erro: "O armazenamento de arquivos ainda não foi configurado.",
    };
  const token = process.env.BLOB_READ_WRITE_TOKEN!;
  try {
    const processo = await prisma.processo.findUnique({
      where: { numero: processoNumero },
    });
    if (!processo) return { ok: false, erro: "Selecione um processo válido." };

    // Sobe o arquivo (nome com sufixo aleatório → URL não adivinhável).
    const seguro = nome.replace(/[^\w.\-]+/g, "_");
    const blob = await put(`processos/${processo.id}/${seguro}`, file, {
      access: "public",
      addRandomSuffix: true,
      token,
      contentType: file.type || undefined,
    });

    // Numeração sequencial por processo (01, 02, 03…). @@unique([processoId,
    // ordem]) evita colisão em anexações simultâneas; em corrida (P2002)
    // recalcula e tenta a próxima.
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const ultimo = await prisma.documento.findFirst({
        where: { processoId: processo.id },
        orderBy: { ordem: "desc" },
        select: { ordem: true },
      });
      const proximaOrdem = (ultimo?.ordem ?? 0) + 1;
      try {
        await prisma.documento.create({
          data: {
            processoId: processo.id,
            ordem: proximaOrdem,
            nome,
            data: hojeBR(),
            blobUrl: blob.url,
            tamanho: file.size,
            mime: file.type || "",
          },
        });
        revalidatePath("/documentos");
        revalidatePath("/processos");
        return { ok: true };
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002"
        ) {
          continue;
        }
        throw e;
      }
    }
    // Não conseguiu registrar: remove o blob órfão.
    await del(blob.url, { token }).catch(() => {});
    return {
      ok: false,
      erro: "Conflito de numeração — tente anexar novamente.",
    };
  } catch {
    return { ok: false, erro: "Não foi possível anexar o documento." };
  }
}

// Exclui um documento (arquivo no Blob + registro). Apenas gestores.
export async function excluirDocumento(id: string): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  if (!ehGestor(s.papel))
    return { ok: false, erro: "Só um gestor pode excluir documentos." };
  try {
    const doc = await prisma.documento.findUnique({ where: { id } });
    if (!doc) return { ok: false, erro: "Documento não encontrado." };
    if (doc.blobUrl && process.env.BLOB_READ_WRITE_TOKEN)
      await del(doc.blobUrl, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }).catch(() => {});
    await prisma.documento.delete({ where: { id } });
    revalidatePath("/documentos");
    revalidatePath("/processos");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível excluir o documento." };
  }
}

export async function ignorarIntimacao(id: string): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  try {
    await prisma.publicacao.updateMany({
      where: { id, statusTriagem: "pendente" },
      data: { statusTriagem: "ignorada" },
    });
    revalidatePath("/publicacoes");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível ignorar a intimação." };
  }
}

// ---- Audiências ----

type AudienciaInput = {
  processoNumero: string;
  titulo: string;
  data: string;
  hora: string;
  tipo: string;
  modalidade: string;
  link: string;
  local: string;
  partes: string;
  participantes: string[];
  observacoes: string;
  lembretes: number[];
};

function modalidadeLink(input: { modalidade: string; link: string }) {
  const modalidade = input.modalidade === "virtual" ? "virtual" : "presencial";
  const link =
    modalidade === "virtual" ? (input.link?.trim() || "").slice(0, 500) : "";
  return { modalidade, link };
}

function validarAudiencia(input: AudienciaInput): string | null {
  if (!input.titulo.trim()) return "Informe o título da audiência.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.data) || !/^\d{2}:\d{2}$/.test(input.hora))
    return "Informe data e horário válidos.";
  return null;
}

export async function criarAudiencia(
  input: AudienciaInput,
): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  const erroVal = validarAudiencia(input);
  if (erroVal) return { ok: false, erro: erroVal };
  const tipo = TIPOS_AUDIENCIA.includes(input.tipo) ? input.tipo : "instrucao";
  const inicio = instanteBRT(input.data, input.hora);
  if (inicio.getTime() <= Date.now())
    return {
      ok: false,
      erro: "Informe uma data e horário futuros para a audiência.",
    };
  try {
    const validas = await iniciaisValidas();
    const parts = (input.participantes ?? []).filter((r) => validas.has(r));
    const processo = input.processoNumero
      ? await prisma.processo.findUnique({
          where: { numero: input.processoNumero },
        })
      : null;
    await prisma.audiencia.create({
      data: {
        processoId: processo?.id ?? null,
        titulo: input.titulo.trim(),
        data: input.data,
        hora: input.hora,
        inicioUtc: inicio,
        tipo,
        ...modalidadeLink(input),
        local: input.local?.trim() || "",
        partes: input.partes?.trim() || "",
        participantes: parts,
        observacoes: input.observacoes?.trim() || "",
        lembretes: { create: limparOffsets(input.lembretes).map((offsetMin) => ({ offsetMin })) },
      },
    });
    revalidatePath("/audiencias");
    revalidatePath("/agenda");
    revalidatePath("/painel");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível criar a audiência." };
  }
}

export async function editarAudiencia(
  input: AudienciaInput & { id: string; status: string },
): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  const erroVal = validarAudiencia(input);
  if (erroVal) return { ok: false, erro: erroVal };
  const tipo = TIPOS_AUDIENCIA.includes(input.tipo) ? input.tipo : "instrucao";
  const status = STATUS_AUDIENCIA.includes(input.status)
    ? input.status
    : "agendada";
  try {
    const gestor = ehGestor(s.papel);
    const alvo = await prisma.audiencia.findUnique({
      where: { id: input.id },
      select: { participantes: true },
    });
    if (!alvo) return { ok: false, erro: "Audiência não encontrada." };
    if (!gestor && !alvo.participantes.includes(s.iniciais))
      return { ok: false, erro: "Sem permissão para editar esta audiência." };
    const inicio = instanteBRT(input.data, input.hora);
    if (status === "agendada" && inicio.getTime() <= Date.now())
      return {
        ok: false,
        erro: "Informe uma data e horário futuros para a audiência.",
      };
    const validas = await iniciaisValidas();
    // Só um gestor altera a lista de participantes (evita remover colegas).
    const parts = gestor
      ? (input.participantes ?? []).filter((r) => validas.has(r))
      : alvo.participantes;
    const processo = input.processoNumero
      ? await prisma.processo.findUnique({
          where: { numero: input.processoNumero },
        })
      : null;
    // Preserva o estado de envio dos lembretes cujo offset não mudou: só
    // remove os retirados e cria os novos (evita reenvio de e-mail).
    const existentes = await prisma.lembrete.findMany({
      where: { audienciaId: input.id },
      select: { offsetMin: true },
    });
    const offsetsAtuais = new Set(existentes.map((e) => e.offsetMin));
    const novos = limparOffsets(input.lembretes);
    const novosSet = new Set(novos);
    const remover = [...offsetsAtuais].filter((o) => !novosSet.has(o));
    const criar = novos.filter((o) => !offsetsAtuais.has(o));
    await prisma.$transaction([
      prisma.lembrete.deleteMany({
        where: { audienciaId: input.id, offsetMin: { in: remover } },
      }),
      prisma.audiencia.update({
        where: { id: input.id },
        data: {
          processoId: processo?.id ?? null,
          titulo: input.titulo.trim(),
          data: input.data,
          hora: input.hora,
          inicioUtc: inicio,
          tipo,
          status,
          ...modalidadeLink(input),
          local: input.local?.trim() || "",
          partes: input.partes?.trim() || "",
          participantes: parts,
          observacoes: input.observacoes?.trim() || "",
          lembretes: { create: criar.map((offsetMin) => ({ offsetMin })) },
        },
      }),
    ]);
    revalidatePath("/audiencias");
    revalidatePath("/agenda");
    revalidatePath("/painel");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível salvar a audiência." };
  }
}

export async function excluirAudiencia(id: string): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  try {
    const alvo = await prisma.audiencia.findUnique({
      where: { id },
      select: { participantes: true },
    });
    if (!alvo) return { ok: false, erro: "Audiência não encontrada." };
    if (!ehGestor(s.papel) && !alvo.participantes.includes(s.iniciais))
      return { ok: false, erro: "Sem permissão para excluir esta audiência." };
    await prisma.audiencia.delete({ where: { id } });
    revalidatePath("/audiencias");
    revalidatePath("/agenda");
    revalidatePath("/painel");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível excluir a audiência." };
  }
}
