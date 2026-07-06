"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";
import { enviarRelatorioDiario, type ResultadoEnvio } from "@/lib/relatorio-envio";

export type AcaoResult = { ok: true } | { ok: false; erro: string };

async function exigirGestor() {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel)) return null;
  return s;
}

const MAX_CAMPO = 4000; // síntese/observações
const MAX_SITUACAO = 2000; // cada lançamento de situação

// Salva os campos do relatório de um processo (tudo menos a situação atual).
export async function salvarProcessoRelatorio(
  processoId: string,
  campos: {
    parteContraria: string;
    parteContrariaTipo: string;
    juizo: string;
    sinteseDoPedido: string;
    valorCausa: string;
    valorEstimado: string;
    audienciaRel: string;
    observacoesRel: string;
  },
): Promise<AcaoResult> {
  const s = await exigirGestor();
  if (!s) return { ok: false, erro: "Sem permissão." };
  const lim = (v: string, max = MAX_CAMPO) => (v ?? "").trim().slice(0, max);
  try {
    await prisma.processo.update({
      where: { id: processoId },
      data: {
        parteContraria: lim(campos.parteContraria, 300),
        parteContrariaTipo: lim(campos.parteContrariaTipo, 60),
        juizo: lim(campos.juizo, 300),
        sinteseDoPedido: lim(campos.sinteseDoPedido),
        valorCausa: lim(campos.valorCausa, 60),
        valorEstimado: lim(campos.valorEstimado, 60),
        audienciaRel: lim(campos.audienciaRel, 300),
        observacoesRel: lim(campos.observacoesRel),
      },
    });
    revalidatePath("/relatorio/clientes");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível salvar." };
  }
}

// Adiciona um lançamento na situação atual do processo.
export async function adicionarSituacao(
  processoId: string,
  texto: string,
): Promise<AcaoResult> {
  const s = await exigirGestor();
  if (!s) return { ok: false, erro: "Sem permissão." };
  const t = (texto ?? "").trim().slice(0, MAX_SITUACAO);
  if (!t) return { ok: false, erro: "Digite o texto da situação." };
  try {
    await prisma.processoAndamento.create({
      data: { processoId, texto: t, autor: s.iniciais },
    });
    revalidatePath("/relatorio/clientes");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível adicionar." };
  }
}

// Edita o texto de um lançamento da situação.
export async function editarSituacao(
  andamentoId: string,
  texto: string,
): Promise<AcaoResult> {
  const s = await exigirGestor();
  if (!s) return { ok: false, erro: "Sem permissão." };
  const t = (texto ?? "").trim().slice(0, MAX_SITUACAO);
  if (!t) return { ok: false, erro: "O texto não pode ficar vazio." };
  try {
    await prisma.processoAndamento.update({
      where: { id: andamentoId },
      data: { texto: t },
    });
    revalidatePath("/relatorio/clientes");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível salvar a situação." };
  }
}

// Remove um lançamento da situação.
export async function removerSituacao(
  andamentoId: string,
): Promise<AcaoResult> {
  const s = await exigirGestor();
  if (!s) return { ok: false, erro: "Sem permissão." };
  try {
    await prisma.processoAndamento.delete({ where: { id: andamentoId } });
    revalidatePath("/relatorio/clientes");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível remover." };
  }
}

// Remove um processo do relatório (ex.: importações antigas erradas).
// Bloqueia se houver tarefas ou documentos vinculados.
export async function removerProcesso(
  processoId: string,
): Promise<AcaoResult> {
  const s = await exigirGestor();
  if (!s) return { ok: false, erro: "Sem permissão." };
  try {
    const [tarefas, docs] = await Promise.all([
      prisma.tarefa.count({ where: { processoId } }),
      prisma.documento.count({ where: { processoId } }),
    ]);
    if (tarefas > 0 || docs > 0)
      return {
        ok: false,
        erro: "Há tarefas ou documentos vinculados a este processo. Remova-os antes.",
      };
    await prisma.processoAndamento.deleteMany({ where: { processoId } });
    await prisma.publicacao.updateMany({
      where: { processoId },
      data: { processoId: null },
    });
    await prisma.audiencia.deleteMany({ where: { processoId } });
    await prisma.processo.delete({ where: { id: processoId } });
    revalidatePath("/relatorio/clientes");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível remover o processo." };
  }
}

// Envia o relatório do dia por e-mail na hora (botão "Enviar agora"). Gestor-only.
export async function enviarRelatorioAgora(
  dataISO: string,
): Promise<ResultadoEnvio> {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel))
    return { ok: false, acoes: 0, erro: "sem permissão" };
  return enviarRelatorioDiario(dataISO);
}
