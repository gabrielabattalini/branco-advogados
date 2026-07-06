import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enviarTelegram, escT } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// Webhook do bot do Telegram. Recebe as mensagens que os usuários mandam ao
// bot. O único fluxo tratado é o vínculo da conta: a pessoa abre o link
// t.me/<bot>?start=<token> e aperta "Iniciar" → chega "/start <token>" aqui,
// e casamos o chat com o usuário dono daquele token.
type TgUpdate = {
  message?: {
    chat?: { id?: number };
    text?: string;
    from?: { first_name?: string };
  };
};

export async function POST(req: Request) {
  // Se um segredo estiver configurado, exige o header que o Telegram envia.
  const segredo = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (
    segredo &&
    req.headers.get("x-telegram-bot-api-secret-token") !== segredo
  ) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TgUpdate;
  try {
    update = (await req.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: true }); // ignora corpo inválido
  }

  const msg = update.message;
  const chatId = msg?.chat?.id;
  const texto = (msg?.text ?? "").trim();
  if (!chatId) return NextResponse.json({ ok: true });
  const chat = String(chatId);

  try {
    if (texto.startsWith("/start")) {
      const token = texto.split(/\s+/)[1] ?? "";
      if (!token) {
        await enviarTelegram(
          chat,
          "Olá! Para receber os avisos, abra o sistema, vá em <b>Perfil</b> e toque em <b>Conectar Telegram</b>.",
        );
        return NextResponse.json({ ok: true });
      }
      const u = await prisma.usuario.findFirst({
        where: { telegramToken: token },
      });
      if (!u) {
        await enviarTelegram(
          chat,
          "Este link expirou. Gere um novo em <b>Perfil → Conectar Telegram</b>.",
        );
        return NextResponse.json({ ok: true });
      }
      await prisma.usuario.update({
        where: { id: u.id },
        data: { telegramChatId: chat, telegramToken: null },
      });
      await enviarTelegram(
        chat,
        `✅ Pronto, ${escT(u.nome.split(/\s+/)[0])}! Você vai receber aqui os avisos de tarefas, prazos e audiências. Para desligar, mande /stop.`,
      );
      return NextResponse.json({ ok: true });
    }

    if (texto.startsWith("/stop")) {
      await prisma.usuario.updateMany({
        where: { telegramChatId: chat },
        data: { telegramChatId: null },
      });
      await enviarTelegram(
        chat,
        "🔕 Avisos desligados. Reative quando quiser em <b>Perfil → Conectar Telegram</b>.",
      );
      return NextResponse.json({ ok: true });
    }

    // Qualquer outra mensagem: ajuda breve.
    await enviarTelegram(
      chat,
      "Sou o assistente do Branco Advogados. Uso este chat só para te avisar de tarefas, prazos e audiências. Comandos: /stop para desligar.",
    );
  } catch {
    /* nunca derruba o webhook — o Telegram reenviaria */
  }
  return NextResponse.json({ ok: true });
}
