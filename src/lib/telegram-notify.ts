import { prisma } from "@/lib/db";
import { telegramConfigurado, enviarTelegram } from "@/lib/telegram";

// Envia um aviso a um conjunto de usuários (por iniciais) que tenham o
// Telegram conectado. Uso interno do servidor (NÃO é uma server action, para
// não ficar exposto ao cliente). Silencioso: nunca lança.
export async function avisarPorIniciais(
  iniciais: string[],
  texto: string,
): Promise<void> {
  if (!telegramConfigurado() || iniciais.length === 0) return;
  try {
    const users = await prisma.usuario.findMany({
      where: {
        iniciais: { in: [...new Set(iniciais)] },
        ativo: true,
        telegramChatId: { not: null },
      },
      select: { telegramChatId: true },
    });
    await Promise.all(
      users.map((u) =>
        u.telegramChatId ? enviarTelegram(u.telegramChatId, texto) : null,
      ),
    );
  } catch {
    /* aviso é secundário */
  }
}
