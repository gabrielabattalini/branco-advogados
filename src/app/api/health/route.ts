import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Endpoint de diagnóstico: confirma se o app consegue ler o banco em produção.
// Mascara credenciais em qualquer mensagem de erro.
const limpar = (s?: string) =>
  (s ?? "").replace(/:\/\/[^@]*@/g, "://***@").slice(0, 800);

export async function GET() {
  const env = {
    DATABASE_URL_UNPOOLED: !!process.env.DATABASE_URL_UNPOOLED,
    DATABASE_URL: !!process.env.DATABASE_URL,
    POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
    AASP_API_KEY: !!process.env.AASP_API_KEY,
    CRON_SECRET: !!process.env.CRON_SECRET,
  };
  try {
    const tarefas = await prisma.tarefa.count();
    const processos = await prisma.processo.count();
    return NextResponse.json({ ok: true, env, tarefas, processos });
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string; code?: string };
    return NextResponse.json(
      {
        ok: false,
        env,
        name: err?.name ?? null,
        code: err?.code ?? null,
        message: limpar(err?.message),
      },
      { status: 200 },
    );
  }
}
