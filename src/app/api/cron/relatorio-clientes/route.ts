import { NextResponse } from "next/server";
import { hojeISO } from "@/lib/hoje";
import { enviarRelatoriosClientes } from "@/lib/relatorio-cliente-envio";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function cronAutorizado(req: Request): boolean {
  const seg = process.env.CRON_SECRET;
  if (!seg) return false;
  return (
    req.headers.get("x-cron-secret") === seg ||
    req.headers.get("authorization") === `Bearer ${seg}`
  );
}

// Cron diário: nos primeiros 5 dias do mês, envia o relatório dos clientes
// marcados como automático que ainda não foram enviados no mês de referência
// (evita duplicar).
async function executar() {
  const dia = Number(hojeISO().slice(8, 10));
  if (dia > 5) return { ok: true, pulado: `fora da janela (dia ${dia})` };
  const r = await enviarRelatoriosClientes({
    soAtivos: true,
    pularJaEnviados: true,
    marcar: true,
  });
  return { ok: true, ...r };
}

export async function GET(req: Request) {
  if (!cronAutorizado(req))
    return NextResponse.json({ ok: false, erro: "não autorizado" }, { status: 401 });
  return NextResponse.json(await executar());
}

export async function POST(req: Request) {
  if (!cronAutorizado(req))
    return NextResponse.json({ ok: false, erro: "não autorizado" }, { status: 401 });
  return NextResponse.json(await executar());
}
