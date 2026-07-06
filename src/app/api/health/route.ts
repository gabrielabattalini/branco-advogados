import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { ehGestor } from "@/lib/papeis";

export const dynamic = "force-dynamic";

// Endpoint de diagnóstico: confirma se o app consegue ler o banco em produção.
// Mascara credenciais em qualquer mensagem de erro.
const limpar = (s?: string) =>
  (s ?? "").replace(/:\/\/[^@]*@/g, "://***@").slice(0, 800);

export async function GET() {
  // Liveness é público (sem detalhes). Os detalhes de diagnóstico (quais env
  // estão setadas, contagens do banco, erros) só para gestor logado ou com o
  // header x-cron-secret — antes ficavam expostos a qualquer um.
  const sessao = await getSessao().catch(() => null);
  const cronSecret = process.env.CRON_SECRET;
  const headerSecret = (await headers()).get("x-cron-secret");
  const autorizado =
    (sessao && ehGestor(sessao.papel)) ||
    (!!cronSecret && headerSecret === cronSecret);

  if (!autorizado) {
    let bancoOk = false;
    try {
      await prisma.tarefa.count();
      bancoOk = true;
    } catch {
      bancoOk = false;
    }
    return NextResponse.json({ ok: bancoOk });
  }

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
