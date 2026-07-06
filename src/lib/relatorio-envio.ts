import { prisma } from "@/lib/db";
import { montarRelatorioDiario } from "@/lib/data";
import { gerarPdfRelatorioDiario } from "@/lib/relatorio-pdf";
import { enviarEmail, emailConfigurado } from "@/lib/email";
import { dataPorExtenso } from "@/lib/hoje";

export type ResultadoEnvio = {
  ok: boolean;
  acoes: number;
  pessoas?: number;
  destinatarios?: number;
  erro?: string;
  motivo?: string;
};

// Destinatários do relatório: RELATORIO_EMAIL (lista por vírgula) ou, na falta,
// os sócios diretores ativos.
async function destinatariosRelatorio(): Promise<string[]> {
  const cfg = (process.env.RELATORIO_EMAIL || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (cfg.length) return cfg;
  const socios = await prisma.usuario.findMany({
    where: { papel: "socio", ativo: true },
    select: { email: true },
  });
  return socios.map((u) => u.email).filter(Boolean);
}

// Gera o PDF do dia e envia por e-mail. Server-only (não é uma action).
export async function enviarRelatorioDiario(
  dataISO: string,
): Promise<ResultadoEnvio> {
  const rel = await montarRelatorioDiario(dataISO);
  const destinatarios = await destinatariosRelatorio();
  if (!emailConfigurado())
    return { ok: false, acoes: rel.total, erro: "e-mail não configurado" };
  if (destinatarios.length === 0)
    return { ok: false, acoes: rel.total, erro: "sem destinatários" };

  const pdf = await gerarPdfRelatorioDiario(rel);
  const base64 = pdf.toString("base64");
  const linhaResumo = rel.pessoas
    .map((p) => `${p.nome}: ${p.acoes.length} ações`)
    .join(" · ");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#2a2a28;max-width:560px">
  <h2 style="color:#056235;margin:0 0 8px">Relatório de atividades do dia</h2>
  <p style="margin:0 0 4px">${dataPorExtenso(dataISO)}</p>
  <p style="margin:0 0 12px;color:#6e6a60">${rel.total} ações registradas${linhaResumo ? ` · ${linhaResumo}` : ""}.</p>
  <p style="margin:0;color:#6e6a60">O relatório completo, por pessoa, está no PDF em anexo.</p>
  <p style="color:#9a9488;font-size:12px;margin-top:16px">Branco Advogados · enviado automaticamente</p>
</div>`;
  const res = await enviarEmail({
    para: destinatarios,
    assunto: `Relatório diário — ${dataPorExtenso(dataISO)}`,
    html,
    texto: `Relatório de atividades do dia (${dataISO}). ${rel.total} ações. PDF em anexo.`,
    anexos: [{ nome: `relatorio-diario-${dataISO}.pdf`, conteudoBase64: base64 }],
  });
  return {
    ok: res.enviado,
    acoes: rel.total,
    pessoas: rel.pessoas.length,
    destinatarios: destinatarios.length,
    motivo: res.enviado ? undefined : res.motivo,
  };
}
