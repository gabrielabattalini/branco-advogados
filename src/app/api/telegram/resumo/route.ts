import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enviarTelegram, telegramConfigurado, escT } from "@/lib/telegram";
import { hojeISO, addDiasISO, brCurto } from "@/lib/hoje";

export const dynamic = "force-dynamic";

// Limite de tarefas ativas por pessoa que dispara o alerta de sobrecarga.
const LIMITE_SOBRECARGA = Number(process.env.LIMITE_SOBRECARGA) || 12;

// Resumo diário via Telegram — pensado para ser chamado UMA vez por manhã por
// um agendador externo (mesmo esquema do /api/lembretes/disparar):
//   1. Para cada pessoa conectada: prazos que vencem hoje/amanhã e audiências
//      de hoje em que ela participa.
//   2. Para os gestores: alerta de quem está com tarefas ativas acima do limite.
async function processar() {
  if (!telegramConfigurado()) return { configurado: false, enviados: 0 };

  const hoje = hojeISO();
  const amanha = addDiasISO(hoje, 1);

  const [usuarios, tarefasAbertas, audienciasHoje] = await Promise.all([
    prisma.usuario.findMany({
      where: { ativo: true, telegramChatId: { not: null } },
      select: {
        iniciais: true,
        nome: true,
        papel: true,
        telegramChatId: true,
      },
    }),
    prisma.tarefa.findMany({
      where: { status: { not: "concluida" } },
      select: {
        titulo: true,
        data: true,
        prazo: true,
        responsaveis: true,
      },
    }),
    prisma.audiencia.findMany({
      where: { status: "agendada", data: hoje },
      select: { titulo: true, hora: true, local: true, participantes: true },
      orderBy: { hora: "asc" },
    }),
  ]);

  let enviados = 0;

  // ---- 1. Resumo por pessoa ----
  for (const u of usuarios) {
    const chat = u.telegramChatId;
    if (!chat) continue;
    const minhas = tarefasAbertas.filter((t) =>
      t.responsaveis.includes(u.iniciais),
    );
    const vencemHoje = minhas.filter((t) => t.data === hoje);
    const vencemAmanha = minhas.filter((t) => t.data === amanha);
    const atrasadas = minhas.filter((t) => t.data && t.data < hoje);
    const audis = audienciasHoje.filter((a) =>
      a.participantes.includes(u.iniciais),
    );

    if (
      vencemHoje.length === 0 &&
      vencemAmanha.length === 0 &&
      atrasadas.length === 0 &&
      audis.length === 0
    )
      continue;

    const linhas: string[] = [
      `☀️ <b>Bom dia, ${escT(u.nome.split(/\s+/)[0])}!</b>`,
    ];
    if (audis.length) {
      linhas.push("", "⚖️ <b>Audiências hoje</b>");
      for (const a of audis)
        linhas.push(
          `• ${escT(a.hora)} — ${escT(a.titulo)}${a.local ? ` (${escT(a.local)})` : ""}`,
        );
    }
    if (atrasadas.length) {
      linhas.push("", `🔴 <b>Em atraso (${atrasadas.length})</b>`);
      for (const t of atrasadas.slice(0, 10))
        linhas.push(`• ${escT(t.titulo)} — venceu ${escT(brCurto(t.data))}`);
    }
    if (vencemHoje.length) {
      linhas.push("", `⏰ <b>Vencem hoje (${vencemHoje.length})</b>`);
      for (const t of vencemHoje) linhas.push(`• ${escT(t.titulo)}`);
    }
    if (vencemAmanha.length) {
      linhas.push("", `🗓 <b>Vencem amanhã (${vencemAmanha.length})</b>`);
      for (const t of vencemAmanha) linhas.push(`• ${escT(t.titulo)}`);
    }
    const r = await enviarTelegram(chat, linhas.join("\n"));
    if (r.enviado) enviados++;
  }

  // ---- 2. Alerta de sobrecarga para gestores ----
  const contagem = new Map<string, number>();
  for (const t of tarefasAbertas)
    for (const r of t.responsaveis)
      contagem.set(r, (contagem.get(r) ?? 0) + 1);
  const nomePorIni = new Map(usuarios.map((u) => [u.iniciais, u.nome]));
  // Nomes de todos (inclui quem não tem Telegram) para o texto do alerta.
  const todos = await prisma.usuario.findMany({
    where: { ativo: true },
    select: { iniciais: true, nome: true },
  });
  for (const u of todos) if (!nomePorIni.has(u.iniciais)) nomePorIni.set(u.iniciais, u.nome);

  const sobrecarregados = [...contagem.entries()]
    .filter(([, n]) => n > LIMITE_SOBRECARGA)
    .sort((a, b) => b[1] - a[1]);

  if (sobrecarregados.length) {
    const gestores = usuarios.filter(
      (u) => (u.papel === "socio" || u.papel === "coordenador") && u.telegramChatId,
    );
    const linhas = [
      `⚠️ <b>Alerta de sobrecarga</b>`,
      `Acima de ${LIMITE_SOBRECARGA} tarefas ativas:`,
      ...sobrecarregados.map(
        ([ini, n]) => `• ${escT(nomePorIni.get(ini) ?? ini)} — ${n} tarefas`,
      ),
    ];
    const msg = linhas.join("\n");
    for (const g of gestores) {
      if (!g.telegramChatId) continue;
      const r = await enviarTelegram(g.telegramChatId, msg);
      if (r.enviado) enviados++;
    }
  }

  return {
    configurado: true,
    pessoas: usuarios.length,
    sobrecarregados: sobrecarregados.length,
    enviados,
  };
}

export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo)
    return NextResponse.json(
      { ok: false, erro: "CRON_SECRET não configurado." },
      { status: 503 },
    );
  if (req.headers.get("x-cron-secret") !== segredo)
    return NextResponse.json({ ok: false, erro: "não autorizado" }, { status: 401 });
  return NextResponse.json({ ok: true, ...(await processar()) });
}

export async function POST(req: Request) {
  return GET(req);
}
