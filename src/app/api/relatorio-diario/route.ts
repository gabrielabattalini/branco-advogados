import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";
import { montarRelatorioDiario } from "@/lib/data";
import { gerarPdfRelatorioDiario } from "@/lib/relatorio-pdf";
import { enviarEmail, emailConfigurado } from "@/lib/email";
import { hojeISO, dataPorExtenso } from "@/lib/hoje";

export const dynamic = "force-dynamic";

function nomeArquivo(dataISO: string): string {
  return `relatorio-diario-${dataISO}.pdf`;
}

// Autorização de cron: aceita tanto o agendador da Vercel (header
// Authorization: Bearer <CRON_SECRET>) quanto um agendador externo
// (header x-cron-secret: <CRON_SECRET>).
function cronAutorizado(req: Request): boolean {
  const seg = process.env.CRON_SECRET;
  if (!seg) return false;
  return (
    req.headers.get("x-cron-secret") === seg ||
    req.headers.get("authorization") === `Bearer ${seg}`
  );
}

// Gera o PDF do dia e envia por e-mail ao(s) destinatário(s).
async function enviarRelatorio(dataISO: string) {
  const rel = await montarRelatorioDiario(dataISO);
  let destinatarios = (process.env.RELATORIO_EMAIL || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (destinatarios.length === 0) {
    const socios = await prisma.usuario.findMany({
      where: { papel: "socio", ativo: true },
      select: { email: true },
    });
    destinatarios = socios.map((u) => u.email).filter(Boolean);
  }
  if (!emailConfigurado())
    return { ok: false, erro: "e-mail não configurado", acoes: rel.total };
  if (destinatarios.length === 0)
    return { ok: false, erro: "sem destinatários", acoes: rel.total };

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
    anexos: [{ nome: nomeArquivo(dataISO), conteudoBase64: base64 }],
  });
  return {
    ok: res.enviado,
    acoes: rel.total,
    pessoas: rel.pessoas.length,
    destinatarios: destinatarios.length,
    motivo: res.enviado ? undefined : res.motivo,
  };
}

// GET:
//  • chamado pelo cron (Vercel/externo) → gera e envia por e-mail;
//  • chamado por um gestor logado → baixa o PDF na hora (?data=yyyy-mm-dd).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const data = url.searchParams.get("data") || hojeISO();

  if (cronAutorizado(req)) {
    return NextResponse.json(await enviarRelatorio(hojeISO()));
  }

  const s = await getSessao();
  if (!s) return NextResponse.redirect(new URL("/login", req.url));
  if (!ehGestor(s.papel))
    return NextResponse.json({ erro: "sem permissão" }, { status: 403 });

  const rel = await montarRelatorioDiario(data);
  const pdf = await gerarPdfRelatorioDiario(rel);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nomeArquivo(data)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

// POST protegido por CRON_SECRET → dispara o envio (agendadores externos).
export async function POST(req: Request) {
  if (!process.env.CRON_SECRET)
    return NextResponse.json(
      { ok: false, erro: "CRON_SECRET não configurado." },
      { status: 503 },
    );
  if (!cronAutorizado(req))
    return NextResponse.json({ ok: false, erro: "não autorizado" }, { status: 401 });
  return NextResponse.json(await enviarRelatorio(hojeISO()));
}
