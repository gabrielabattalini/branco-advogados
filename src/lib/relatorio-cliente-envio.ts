import { prisma } from "@/lib/db";
import { getRelatorioClienteDados } from "@/lib/data";
import { gerarPdfRelatorioCliente } from "@/lib/relatorio-cliente-pdf";
import { enviarEmail, emailConfigurado } from "@/lib/email";
import { hojeISO } from "@/lib/hoje";

const MESES = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

// Mês de referência (o anterior ao atual). Ex.: "JUNHO DE 2026" e chave "2026-06".
export function mesReferencia(hoje = hojeISO()): { titulo: string; chave: string } {
  let ano = Number(hoje.slice(0, 4));
  let mes = Number(hoje.slice(5, 7)) - 1;
  if (mes < 1) {
    mes = 12;
    ano -= 1;
  }
  return {
    titulo: `${MESES[mes - 1]} DE ${ano}`,
    chave: `${ano}-${String(mes).padStart(2, "0")}`,
  };
}

function normNome(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Dado uma config da planilha, acha o cliente (Processo.cliente) correspondente.
function clienteDaConfig(
  config: { nome: string; nomeArquivo: string },
  clientes: { cliente: string; arquivo: string }[],
): string | null {
  const na = normNome(config.nomeArquivo);
  const nn = normNome(config.nome);
  if (na) {
    const e = clientes.find((c) => normNome(c.arquivo) === na);
    if (e) return e.cliente;
    const p = clientes.find((c) => {
      const x = normNome(c.arquivo);
      return x && (x.startsWith(na) || na.startsWith(x)) && Math.min(x.length, na.length) >= 4;
    });
    if (p) return p.cliente;
  }
  const m = clientes.find((c) => nn.length >= 4 && normNome(c.cliente).includes(nn));
  return m ? m.cliente : null;
}

async function clientesComArquivo(): Promise<{ cliente: string; arquivo: string }[]> {
  const rows = await prisma.processo.findMany({
    select: { cliente: true, arquivoOrigem: true },
    distinct: ["cliente"],
  });
  return rows
    .filter((r) => r.cliente)
    .map((r) => ({ cliente: r.cliente, arquivo: r.arquivoOrigem }));
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function corpoParaHtml(texto: string): string {
  const corpo = esc(texto).replace(/\r?\n/g, "<br>");
  return `<div style="font-family:Arial,Helvetica,sans-serif;color:#2a2a28;max-width:600px;line-height:1.6">${corpo}<p style="color:#9a9488;font-size:12px;margin-top:16px">Branco Advogados</p></div>`;
}

function corpoPadrao(cliente: string, mesAno: string): string {
  return corpoParaHtml(
    `Prezado(a) ${cliente},\n\nSegue em anexo o relatório de andamento processual referente a ${mesAno}.\n\nAtenciosamente,\nBranco Advogados`,
  );
}

export type EnvioClienteResultado = {
  ok: boolean;
  cliente?: string;
  destinatarios?: number;
  motivo?: string;
};

// Envia o relatório de UM cliente (a partir da config da planilha).
export async function enviarRelatorioCliente(
  configId: string,
  opts?: { marcar?: boolean; hoje?: string },
): Promise<EnvioClienteResultado> {
  const config = await prisma.clienteRelatorio.findUnique({ where: { id: configId } });
  if (!config) return { ok: false, motivo: "cadastro não encontrado" };
  const emails = config.emails
    .split(/[;,]/)
    .map((e) => e.trim())
    .filter((e) => /\S+@\S+\.\S+/.test(e));
  if (!emails.length) return { ok: false, motivo: "sem e-mail válido cadastrado" };
  const { titulo: mesAno, chave } = mesReferencia(opts?.hoje);

  const clientes = await clientesComArquivo();
  const cliente = clienteDaConfig(config, clientes);
  if (!cliente) return { ok: false, motivo: "cliente sem processos no sistema" };
  const dados = await getRelatorioClienteDados(cliente);
  if (!dados) return { ok: false, motivo: "cliente sem processos" };
  if (!emailConfigurado()) return { ok: false, cliente, motivo: "e-mail não configurado (RESEND_API_KEY)" };

  const pdf = await gerarPdfRelatorioCliente({ cliente: dados.cliente, mesAno, processos: dados.processos });
  const corpo = (config.corpoEmail || "").trim()
    ? corpoParaHtml((config.corpoEmail || "").replace(/\{MES_ANO_REFERENCIA_TITULO\}/gi, mesAno))
    : corpoPadrao(dados.cliente, mesAno);
  const baseArq = (config.nomeArquivo || dados.cliente).replace(/[^\w\s.-]/g, "").trim().slice(0, 70);
  const nomeArq = `Relatorio ${baseArq} ${chave}.pdf`;

  const res = await enviarEmail({
    para: emails,
    assunto: `Relatório de Andamento Processual — ${mesAno}`,
    html: corpo,
    texto: `Segue o relatório de andamento processual referente a ${mesAno}. PDF em anexo.`,
    anexos: [{ nome: nomeArq, conteudoBase64: pdf.toString("base64") }],
  });
  if (res.enviado && opts?.marcar) {
    await prisma.clienteRelatorio.update({ where: { id: config.id }, data: { ultimoEnvio: chave } });
  }
  return {
    ok: res.enviado,
    cliente: dados.cliente,
    destinatarios: emails.length,
    motivo: res.enviado ? undefined : res.motivo,
  };
}

export type EnvioLoteResultado = {
  enviados: number;
  falhas: number;
  detalhes: { cadastro: string; ok: boolean; motivo?: string }[];
};

// Envia o relatório de vários clientes (todos, ou só ativos e ainda não enviados no mês).
export async function enviarRelatoriosClientes(opts?: {
  soAtivos?: boolean;
  pularJaEnviados?: boolean;
  hoje?: string;
  marcar?: boolean;
}): Promise<EnvioLoteResultado> {
  const { chave } = mesReferencia(opts?.hoje);
  const configs = await prisma.clienteRelatorio.findMany({
    where: opts?.soAtivos ? { ativo: true } : {},
    orderBy: { nome: "asc" },
  });
  const detalhes: EnvioLoteResultado["detalhes"] = [];
  let enviados = 0;
  let falhas = 0;
  for (const c of configs) {
    if (opts?.pularJaEnviados && c.ultimoEnvio === chave) continue;
    const r = await enviarRelatorioCliente(c.id, { marcar: opts?.marcar, hoje: opts?.hoje });
    detalhes.push({ cadastro: c.nome, ok: r.ok, motivo: r.motivo });
    if (r.ok) enviados++;
    else falhas++;
  }
  return { enviados, falhas, detalhes };
}
