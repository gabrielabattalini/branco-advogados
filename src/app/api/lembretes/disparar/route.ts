import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enviarEmail, emailConfigurado } from "@/lib/email";
import { formatOffset, brData, labelTipoAudiencia } from "@/lib/audiencia";

export const dynamic = "force-dynamic";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function processar() {
  const agora = new Date();
  const configurado = emailConfigurado();
  // Candidatos: lembretes não enviados de audiências futuras agendadas.
  const lembretes = await prisma.lembrete.findMany({
    where: {
      enviadoEm: null,
      audiencia: { status: "agendada", inicioUtc: { gt: agora } },
    },
    include: { audiencia: true },
    take: 300,
  });
  const devidos = lembretes.filter(
    (l) =>
      l.audiencia.inicioUtc.getTime() - l.offsetMin * 60000 <= agora.getTime(),
  );
  // Sem provedor de e-mail, não marca nada (envia quando configurar).
  if (devidos.length === 0 || !configurado) {
    return { verificados: lembretes.length, devidos: devidos.length, enviados: 0, configurado };
  }

  const inis = [...new Set(devidos.flatMap((l) => l.audiencia.participantes))];
  const usuarios = inis.length
    ? await prisma.usuario.findMany({
        where: { iniciais: { in: inis }, ativo: true },
        select: { iniciais: true, email: true },
      })
    : [];
  const emailPorIni = new Map(usuarios.map((u) => [u.iniciais, u.email]));

  let enviados = 0;
  for (const l of devidos) {
    // Claim atômico: só um processo marca enviadoEm (idempotência — evita
    // reenvio quando dois ciclos do cron rodam em paralelo).
    const claim = await prisma.lembrete.updateMany({
      where: { id: l.id, enviadoEm: null },
      data: { enviadoEm: agora },
    });
    if (claim.count !== 1) continue;

    const a = l.audiencia;
    const para = a.participantes
      .map((i) => emailPorIni.get(i))
      .filter((e): e is string => !!e);
    const quando = `${brData(a.data)} às ${a.hora}`;
    const antecedencia = formatOffset(l.offsetMin).replace(" antes", "");
    const assunto = `Lembrete: ${a.titulo} — ${quando}`;
    const linha = (rotulo: string, valor: string) =>
      valor ? `<li><strong>${rotulo}:</strong> ${esc(valor)}</li>` : "";
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#2a2a28;max-width:520px">
  <h2 style="color:#21314f;margin:0 0 8px">Lembrete de audiência</h2>
  <p style="margin:0 0 4px"><strong>${esc(a.titulo)}</strong> — ${esc(labelTipoAudiencia(a.tipo))}</p>
  <p style="margin:0 0 12px;color:#6e6a60">Faltam ${esc(antecedencia)} para a audiência.</p>
  <ul style="padding-left:18px;line-height:1.6">
    ${linha("Quando", quando)}
    ${linha("Local", a.local)}
    ${linha("Partes", a.partes)}
    ${linha("Observações", a.observacoes)}
  </ul>
  <p style="color:#9a9488;font-size:12px;margin-top:16px">Branco Advogados · sistema interno</p>
</div>`;
    const texto = `Lembrete: ${a.titulo} — ${quando}. ${a.local}`;
    const res = await enviarEmail({ para, assunto, html, texto });
    if (res.enviado) {
      enviados++;
    } else {
      // Falhou: devolve para a fila (tenta no próximo ciclo).
      await prisma.lembrete.update({
        where: { id: l.id },
        data: { enviadoEm: null },
      });
    }
  }
  return { verificados: lembretes.length, devidos: devidos.length, enviados, configurado };
}

export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET;
  // Exige CRON_SECRET configurado (sem ele o endpoint nem responde — evita abuso).
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
