import { NextResponse } from "next/server";
import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";
import { montarRelatorioDiario } from "@/lib/data";
import { gerarPdfRelatorioDiario } from "@/lib/relatorio-pdf";
import { enviarRelatorioDiario } from "@/lib/relatorio-envio";
import { hojeISO } from "@/lib/hoje";

export const dynamic = "force-dynamic";

function nomeArquivo(dataISO: string): string {
  return `relatorio-diario-${dataISO}.pdf`;
}

// Autorização de cron: aceita o agendador da Vercel (Authorization: Bearer
// <CRON_SECRET>) e agendadores externos (x-cron-secret: <CRON_SECRET>).
function cronAutorizado(req: Request): boolean {
  const seg = process.env.CRON_SECRET;
  if (!seg) return false;
  return (
    req.headers.get("x-cron-secret") === seg ||
    req.headers.get("authorization") === `Bearer ${seg}`
  );
}

// GET:
//  • chamado pelo cron (Vercel/externo) → gera e envia por e-mail;
//  • chamado por um gestor logado → baixa o PDF na hora (?data=yyyy-mm-dd).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const data = url.searchParams.get("data") || hojeISO();

  if (cronAutorizado(req)) {
    return NextResponse.json(await enviarRelatorioDiario(hojeISO()));
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
  return NextResponse.json(await enviarRelatorioDiario(hojeISO()));
}
