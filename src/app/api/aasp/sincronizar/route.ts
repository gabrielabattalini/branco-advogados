import { NextResponse } from "next/server";
import { aaspConfigurada } from "@/lib/aasp-api";
import { sincronizarAASPCore } from "@/lib/aasp-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Rotina diária: busca as publicações na API da AASP e joga na triagem.
// Protegida por CRON_SECRET (header x-cron-secret), igual à de lembretes.
async function handler(req: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo)
    return NextResponse.json(
      { ok: false, erro: "CRON_SECRET não configurado." },
      { status: 503 },
    );
  if (req.headers.get("x-cron-secret") !== segredo)
    return NextResponse.json({ ok: false, erro: "não autorizado" }, { status: 401 });
  if (!aaspConfigurada())
    return NextResponse.json(
      { ok: false, erro: "AASP_API_KEY não configurada." },
      { status: 503 },
    );
  // Busca os últimos 3 dias (cobre fim de semana/feriado); dedup evita repetir.
  const url = new URL(req.url);
  const dias = Math.min(Math.max(Number(url.searchParams.get("dias")) || 3, 1), 10);
  try {
    const res = await sincronizarAASPCore(dias);
    return NextResponse.json({ ok: true, ...res });
  } catch {
    return NextResponse.json(
      { ok: false, erro: "Falha ao consultar a AASP." },
      { status: 502 },
    );
  }
}

export async function GET(req: Request) {
  return handler(req);
}
export async function POST(req: Request) {
  return handler(req);
}
