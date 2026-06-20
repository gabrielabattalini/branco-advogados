"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { HOJE_ISO, HOJE_BR, responsaveis } from "@/lib/mock";

export type ActionResult = { ok: true } | { ok: false; erro: string };

const AREAS = ["trabalhista", "civel"];
const STATUSES = ["a_fazer", "em_curso", "concluida"];
const INICIAIS = responsaveis.map((r) => r.iniciais);

export async function criarTarefa(input: {
  titulo: string;
  processoNumero: string;
  area: string;
  data: string;
  prazo: string;
  responsavel: string;
}): Promise<ActionResult> {
  const titulo = input.titulo.trim();
  if (!titulo) return { ok: false, erro: "Informe o título da tarefa." };
  const area = AREAS.includes(input.area) ? input.area : "civel";
  const responsavel = INICIAIS.includes(input.responsavel)
    ? input.responsavel
    : INICIAIS[0];
  try {
    const processo = input.processoNumero
      ? await prisma.processo.findUnique({
          where: { numero: input.processoNumero },
        })
      : null;
    await prisma.tarefa.create({
      data: {
        titulo,
        processoId: processo?.id ?? null,
        area,
        data: input.data || HOJE_ISO,
        prazo: input.prazo,
        status: "a_fazer",
        responsavel,
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
  if (!STATUSES.includes(status)) return { ok: false, erro: "Status inválido." };
  try {
    await prisma.tarefa.update({ where: { id }, data: { status } });
    revalidatePath("/tarefas");
    revalidatePath("/painel");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível atualizar o status." };
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
            responsavel: responsaveis[0].nome,
            responsavelIniciais: responsaveis[0].iniciais,
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
          responsavel: responsaveis[0].iniciais,
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

export async function ignorarIntimacao(id: string): Promise<ActionResult> {
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
