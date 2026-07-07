import { prisma } from "@/lib/db";

// Configurações globais simples (chave/valor).
export const CHAVE_ENVIO_AUTO = "envioAutomaticoClientes"; // "on" | "off"

export async function getConfig(chave: string, padrao = ""): Promise<string> {
  const c = await prisma.configuracao.findUnique({ where: { chave } });
  return c?.valor ?? padrao;
}

export async function setConfig(chave: string, valor: string): Promise<void> {
  await prisma.configuracao.upsert({
    where: { chave },
    update: { valor },
    create: { chave, valor },
  });
}

export async function envioAutomaticoLigado(): Promise<boolean> {
  return (await getConfig(CHAVE_ENVIO_AUTO, "off")) === "on";
}
