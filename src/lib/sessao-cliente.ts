import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { assinarTokenCliente, lerTokenCliente } from "@/lib/seguranca";

export type SessaoCliente = {
  id: string;
  nomeCliente: string;
  login: string;
};

const COOKIE = "cliente_sessao";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 dias

// Sessão do portal do cliente — completamente isolada da sessão da equipe.
export const getSessaoCliente = cache(async (): Promise<SessaoCliente | null> => {
  const c = await cookies();
  const id = lerTokenCliente(c.get(COOKIE)?.value);
  if (!id) return null;
  const cl = await prisma.clienteAcesso.findUnique({ where: { id } });
  if (!cl || !cl.ativo) return null;
  return { id: cl.id, nomeCliente: cl.nomeCliente, login: cl.login };
});

export async function definirSessaoCliente(id: string) {
  const c = await cookies();
  c.set(COOKIE, assinarTokenCliente(id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/cliente",
    maxAge: MAX_AGE,
  });
}

export async function limparSessaoCliente() {
  const c = await cookies();
  c.delete({ name: COOKIE, path: "/cliente" });
}
