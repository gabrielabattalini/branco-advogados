"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";
import { CATEGORIAS_VALIDAS } from "@/lib/relatorio-categorias";
import { setConfig, CHAVE_ENVIO_AUTO } from "@/lib/config";
import {
  enviarRelatorioCliente,
  enviarRelatoriosClientes,
  type EnvioClienteResultado,
  type EnvioLoteResultado,
} from "@/lib/relatorio-cliente-envio";
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
    categoria: string;
    infoAdicional: string;
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
        categoria: CATEGORIAS_VALIDAS.includes(campos.categoria) ? campos.categoria : "judicial",
        infoAdicional: lim(campos.infoAdicional),
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

// ---- Aba de Envio (config da planilha + envio dos relatórios dos clientes) ----

// Liga/desliga o envio automático mensal dos relatórios dos clientes.
export async function setEnvioAutomaticoClientes(
  ligado: boolean,
): Promise<AcaoResult> {
  const s = await exigirGestor();
  if (!s) return { ok: false, erro: "Sem permissão." };
  await setConfig(CHAVE_ENVIO_AUTO, ligado ? "on" : "off");
  revalidatePath("/relatorio/envio");
  return { ok: true };
}

// Salva a config de envio de um cliente (e-mails, corpo, arquivo, tipo, ativo).
export async function salvarEnvioConfig(
  id: string,
  campos: {
    emails: string;
    corpoEmail: string;
    nomeArquivo: string;
    tipo: string;
    ativo: boolean;
  },
): Promise<AcaoResult> {
  const s = await exigirGestor();
  if (!s) return { ok: false, erro: "Sem permissão." };
  try {
    await prisma.clienteRelatorio.update({
      where: { id },
      data: {
        emails: (campos.emails ?? "").trim().slice(0, 2000),
        corpoEmail: (campos.corpoEmail ?? "").slice(0, 6000),
        nomeArquivo: (campos.nomeArquivo ?? "").trim().slice(0, 200),
        tipo: /pj/i.test(campos.tipo) ? "PJ" : /pf/i.test(campos.tipo) ? "PF" : "",
        ativo: !!campos.ativo,
      },
    });
    revalidatePath("/relatorio/envio");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível salvar." };
  }
}

// Remove um cadastro de envio.
export async function removerEnvioConfig(id: string): Promise<AcaoResult> {
  const s = await exigirGestor();
  if (!s) return { ok: false, erro: "Sem permissão." };
  try {
    await prisma.clienteRelatorio.delete({ where: { id } });
    revalidatePath("/relatorio/envio");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível remover." };
  }
}

// Envia o relatório de um cliente agora (botão "Enviar agora").
export async function enviarRelatorioClienteAgora(
  id: string,
): Promise<EnvioClienteResultado> {
  const s = await exigirGestor();
  if (!s) return { ok: false, motivo: "sem permissão" };
  return enviarRelatorioCliente(id);
}

// Envia agora os relatórios de todos os clientes ativos.
export async function enviarTodosRelatoriosClientesAgora(): Promise<
  EnvioLoteResultado | { erro: string }
> {
  const s = await exigirGestor();
  if (!s) return { erro: "sem permissão" };
  return enviarRelatoriosClientes({ soAtivos: true });
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
