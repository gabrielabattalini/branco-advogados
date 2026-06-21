"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { HOJE_ISO, HOJE_BR, STATUS_LIST } from "@/lib/mock";
import { getSessao, ehGestor } from "@/lib/sessao";
import { instanteBRT } from "@/lib/audiencia";

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

const AREAS = ["trabalhista", "civel"];
const STATUSES = STATUS_LIST.map((s) => s.key as string);

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
  prazo: string;
  responsaveis: string[];
}): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  const titulo = input.titulo.trim();
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
    await prisma.tarefa.create({
      data: {
        titulo,
        descricao: input.descricao?.trim() || null,
        processoId: processo?.id ?? null,
        area,
        data: input.data || HOJE_ISO,
        prazo: input.prazo,
        status: "a_fazer",
        responsaveis: resps,
        origem: "manual",
      },
    });
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
      select: { responsaveis: true },
    });
    if (!tarefa) return { ok: false, erro: "Tarefa não encontrada." };
    if (!ehGestor(s.papel) && !tarefa.responsaveis.includes(s.iniciais))
      return { ok: false, erro: "Sem permissão para esta tarefa." };
    await prisma.tarefa.update({ where: { id }, data: { status } });
    revalidatePath("/tarefas");
    revalidatePath("/painel");
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
  prazo: string;
  responsaveis: string[];
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
      select: { responsaveis: true },
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
    const [, mm, dd] = (input.data || HOJE_ISO).split("-");
    await prisma.tarefa.update({
      where: { id: input.id },
      data: {
        titulo,
        descricao: input.descricao?.trim() || null,
        processoId: processo?.id ?? null,
        status: input.status,
        responsaveis: resps,
        // Prazo/data só um gestor pode alterar.
        ...(gestor
          ? { data: input.data, prazo: input.prazo || `${dd}/${mm}` }
          : {}),
      },
    });
    revalidatePath("/tarefas");
    revalidatePath("/painel");
    revalidatePath("/processos");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível salvar a tarefa." };
  }
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
  try {
    const validas = await iniciaisValidas();
    const parts = (input.participantes ?? []).filter((r) => validas.has(r));
    await prisma.eventoAgenda.create({
      data: {
        titulo,
        tipo,
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
        distribuido: HOJE_BR,
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
            distribuido: HOJE_BR,
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
          data: HOJE_ISO,
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

export async function criarDocumento(input: {
  processoNumero: string;
  nome: string;
}): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  const nome = input.nome.trim();
  if (!nome) return { ok: false, erro: "Informe o nome do documento." };
  if (nome.length > 255)
    return { ok: false, erro: "Nome muito longo (máx. 255 caracteres)." };
  try {
    const processo = await prisma.processo.findUnique({
      where: { numero: input.processoNumero },
    });
    if (!processo) return { ok: false, erro: "Selecione um processo válido." };

    // Numeração sequencial por processo (01, 02, 03…). A constraint
    // @@unique([processoId, ordem]) garante que duas anexações simultâneas não
    // recebam o mesmo número; em caso de corrida (P2002) tentamos a próxima.
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
            data: HOJE_BR,
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
          continue; // outra anexação pegou esse número — recalcula e tenta de novo
        }
        throw e;
      }
    }
    return {
      ok: false,
      erro: "Conflito de numeração — tente anexar novamente.",
    };
  } catch {
    return { ok: false, erro: "Não foi possível anexar o documento." };
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
  local: string;
  partes: string;
  participantes: string[];
  observacoes: string;
  lembretes: number[];
};

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
