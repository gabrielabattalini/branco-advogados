"use server";

import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { telegramConfigurado, getBotUsername } from "@/lib/telegram";

export type TelegramLink =
  | { ok: true; url: string }
  | { ok: false; erro: string };

// Gera (ou reaproveita) um token de vínculo e devolve o link t.me do bot.
export async function gerarLinkTelegram(): Promise<TelegramLink> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  if (!telegramConfigurado())
    return {
      ok: false,
      erro: "As notificações por Telegram ainda não foram configuradas.",
    };
  const bot = await getBotUsername();
  if (!bot)
    return {
      ok: false,
      erro: "Não foi possível falar com o bot do Telegram. Tente mais tarde.",
    };
  try {
    const token = randomBytes(12).toString("hex");
    await prisma.usuario.update({
      where: { id: s.id },
      data: { telegramToken: token },
    });
    return { ok: true, url: `https://t.me/${bot}?start=${token}` };
  } catch {
    return { ok: false, erro: "Não foi possível gerar o link." };
  }
}

export async function desconectarTelegram(): Promise<{ ok: boolean }> {
  const s = await getSessao();
  if (!s) return { ok: false };
  try {
    await prisma.usuario.update({
      where: { id: s.id },
      data: { telegramChatId: null, telegramToken: null },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// Estado da conexão para a tela de Perfil.
export async function getStatusTelegram(): Promise<{
  configurado: boolean;
  conectado: boolean;
}> {
  const s = await getSessao();
  if (!s) return { configurado: telegramConfigurado(), conectado: false };
  const u = await prisma.usuario.findUnique({
    where: { id: s.id },
    select: { telegramChatId: true },
  });
  return { configurado: telegramConfigurado(), conectado: !!u?.telegramChatId };
}
