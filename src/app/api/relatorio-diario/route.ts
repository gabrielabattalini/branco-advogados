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

// GET com sessão de gestor → baixa o PDF do dia na hora (?data=yyyy-mm-dd).
export async function GET(req: Request) {
  const s = await getSessao();
  if (!s) return NextResponse.redirect(new URL("/login", req.url));
  if (!ehGestor(s.papel))
    return NextResponse.json({ erro: "sem permissão" }, { status: 403 });

  const url = new URL(req.url);
  const data = url.searchParams.get("data") || hojeISO();
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

// POST protegido por CRON_SECRET → gera o PDF do dia e envia por e-mail ao(s)
// destinatário(s). Pensado para rodar todo dia às 19h (Brasília).
export async function POST(req: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo)
    return NextResponse.json(
      { ok: false, erro: "CRON_SECRET não configurado." },
      { status: 503 },
    );
  if (req.headers.get("x-cron-secret") !== segredo)
    return NextResponse.json({ ok: false, erro: "não autorizado" }, { status: 401 });

  const data = hojeISO();
  const rel = await montarRelatorioDiario(data);

  // Destinatários: RELATORIO_EMAIL (lista separada por vírgula) ou, na falta,
  // os sócios diretores ativos.
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
    return NextResponse.json({ ok: false, erro: "e-mail não configurado", acoes: rel.total });
  if (destinatarios.length === 0)
    return NextResponse.json({ ok: false, erro: "sem destinatários", acoes: rel.total });

  const pdf = await gerarPdfRelatorioDiario(rel);
  const base64 = pdf.toString("base64");
  const linhaResumo = rel.pessoas
    .map((p) => `${p.nome}: ${p.acoes.length} ações`)
    .join(" · ");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#2a2a28;max-width:560px">
  <h2 style="color:#056235;margin:0 0 8px">Relatório de atividades do dia</h2>
  <p style="margin:0 0 4px">${dataPorExtenso(data)}</p>
  <p style="margin:0 0 12px;color:#6e6a60">${rel.total} ações registradas${linhaResumo ? ` · ${linhaResumo}` : ""}.</p>
  <p style="margin:0;color:#6e6a60">O relatório completo, por pessoa, está no PDF em anexo.</p>
  <p style="color:#9a9488;font-size:12px;margin-top:16px">Branco Advogados · enviado automaticamente</p>
</div>`;
  const res = await enviarEmail({
    para: destinatarios,
    assunto: `Relatório diário — ${dataPorExtenso(data)}`,
    html,
    texto: `Relatório de atividades do dia (${data}). ${rel.total} ações. PDF em anexo.`,
    anexos: [{ nome: nomeArquivo(data), conteudoBase64: base64 }],
  });

  return NextResponse.json({
    ok: res.enviado,
    acoes: rel.total,
    pessoas: rel.pessoas.length,
    destinatarios: destinatarios.length,
    motivo: res.enviado ? undefined : res.motivo,
  });
}
