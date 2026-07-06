// Envio de mensagens via bot do Telegram (HTTP direto, sem SDK). Se
// TELEGRAM_BOT_TOKEN não estiver configurado, tudo vira no-op — a estrutura
// fica pronta para ligar depois (mesmo padrão do e-mail).

export function telegramConfigurado(): boolean {
  return !!process.env.TELEGRAM_BOT_TOKEN;
}

function api(metodo: string): string {
  return `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${metodo}`;
}

type EnvioTelegram = { enviado: boolean; motivo?: string };

// Envia uma mensagem (HTML) para um chat. Nunca lança — devolve status.
export async function enviarTelegram(
  chatId: string,
  texto: string,
): Promise<EnvioTelegram> {
  if (!telegramConfigurado()) return { enviado: false, motivo: "sem token" };
  if (!chatId) return { enviado: false, motivo: "sem chat" };
  try {
    const res = await fetch(api("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: texto,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) return { enviado: false, motivo: `http ${res.status}` };
    const json = (await res.json()) as { ok?: boolean; description?: string };
    return json.ok
      ? { enviado: true }
      : { enviado: false, motivo: json.description ?? "erro" };
  } catch (e) {
    return { enviado: false, motivo: (e as Error).message };
  }
}

// Nome de usuário do bot (@nome) — usado para montar o link de vínculo
// t.me/<bot>?start=<token>. Cacheado em memória durante o processo.
let usernameCache: string | null = null;
export async function getBotUsername(): Promise<string | null> {
  if (!telegramConfigurado()) return null;
  if (usernameCache) return usernameCache;
  try {
    const res = await fetch(api("getMe"));
    if (!res.ok) return null;
    const json = (await res.json()) as {
      ok?: boolean;
      result?: { username?: string };
    };
    usernameCache = json.result?.username ?? null;
    return usernameCache;
  } catch {
    return null;
  }
}

// Escapa texto para o parse_mode HTML do Telegram.
export function escT(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
