"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";
import { CATEGORIAS_VALIDAS } from "@/lib/relatorio-categorias";
import { setConfig, CHAVE_ENVIO_AUTO } from "@/lib/config";
import { acharConfigRelatorio } from "@/lib/data";
import {
  enviarRelatorioCliente,
  type EnvioClienteResultado,
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

// ---- Envio do relatório de cada cliente (dentro da página do cliente) ----

// Acha (ou cria) a config de envio de um cliente. Retorna o id.
async function configDoCliente(cliente: string): Promise<string | null> {
  const proc = await prisma.processo.findFirst({
    where: { cliente },
    select: { arquivoOrigem: true },
  });
  if (!proc) return null;
  const configs = await prisma.clienteRelatorio.findMany();
  const cfg = acharConfigRelatorio(cliente, proc.arquivoOrigem ?? "", configs);
  return cfg?.id ?? null;
}

// Liga/desliga o envio automático mensal.
export async function setEnvioAutomaticoClientes(
  ligado: boolean,
): Promise<AcaoResult> {
  const s = await exigirGestor();
  if (!s) return { ok: false, erro: "Sem permissão." };
  await setConfig(CHAVE_ENVIO_AUTO, ligado ? "on" : "off");
  revalidatePath("/relatorio/clientes");
  return { ok: true };
}

// Salva os dados de envio de um cliente (e-mails, corpo, nome do arquivo,
// tipo, envio automático). Cria o cadastro se ainda não existir.
export async function salvarEnvioCliente(
  cliente: string,
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
  const dados = {
    emails: (campos.emails ?? "").trim().slice(0, 2000),
    corpoEmail: (campos.corpoEmail ?? "").slice(0, 6000),
    nomeArquivo: (campos.nomeArquivo ?? "").trim().slice(0, 200),
    tipo: /pj/i.test(campos.tipo) ? "PJ" : /pf/i.test(campos.tipo) ? "PF" : "",
    ativo: !!campos.ativo,
  };
  try {
    const proc = await prisma.processo.findFirst({
      where: { cliente },
      select: { arquivoOrigem: true },
    });
    const configs = await prisma.clienteRelatorio.findMany();
    const cfg = acharConfigRelatorio(cliente, proc?.arquivoOrigem ?? "", configs);
    if (cfg) {
      await prisma.clienteRelatorio.update({ where: { id: cfg.id }, data: dados });
    } else {
      await prisma.clienteRelatorio.create({
        data: {
          nome: cliente,
          ...dados,
          nomeArquivo: dados.nomeArquivo || (proc?.arquivoOrigem ?? ""),
        },
      });
    }
    revalidatePath("/relatorio/clientes");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível salvar." };
  }
}

// Envia agora o relatório de um cliente (botão ao lado do relatório).
export async function enviarRelatorioPorCliente(
  cliente: string,
): Promise<EnvioClienteResultado> {
  const s = await exigirGestor();
  if (!s) return { ok: false, motivo: "sem permissão" };
  const id = await configDoCliente(cliente);
  if (!id)
    return { ok: false, motivo: "Cadastre o e-mail de envio na página do cliente." };
  return enviarRelatorioCliente(id);
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
