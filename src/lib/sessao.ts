import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  assinarToken,
  lerToken,
  assinarDispositivo,
  lerDispositivo,
} from "@/lib/seguranca";
import { PAPEIS, type Papel } from "@/lib/papeis";

export type { Papel };
export { PAPEIS, LABEL_PAPEL, ehGestor, labelPapel } from "@/lib/papeis";

export type AreaPerfil = "civel" | "trabalhista";

export type Sessao = {
  id: string;
  nome: string;
  email: string;
  area: AreaPerfil;
  papel: Papel;
  iniciais: string;
};

const COOKIE = "sessao";
const COOKIE_DISP = "aparelho"; // marca o aparelho como confiável (pula o 2FA)
const MAX_AGE = 60 * 60 * 24 * 14; // 14 dias (igual à expiração do token)
const MAX_AGE_DISP = 60 * 60 * 24 * 60; // 60 dias

// Lê e valida a sessão a partir do cookie assinado. cache() deduplica as
// chamadas dentro de um mesmo render (layout + página + data layer).
export const getSessao = cache(async (): Promise<Sessao | null> => {
  const c = await cookies();
  const userId = lerToken(c.get(COOKIE)?.value);
  if (!userId) return null;
  const u = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!u || !u.ativo) return null;
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    area: u.area === "trabalhista" ? "trabalhista" : "civel",
    papel: PAPEIS.includes(u.papel as Papel) ? (u.papel as Papel) : "advogado",
    iniciais: u.iniciais,
  };
});

export async function getPapel(): Promise<Papel> {
  return (await getSessao())?.papel ?? "advogado";
}

// Grava/limpa o cookie de sessão. Só pode ser chamado dentro de Server Actions
// ou Route Handlers (onde escrever cookies é permitido).
export async function definirSessao(userId: string) {
  const c = await cookies();
  c.set(COOKIE, assinarToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function limparSessao() {
  const c = await cookies();
  c.delete(COOKIE);
}

// ---- Aparelho confiável (lembra o dispositivo após o 2FA por e-mail) ----

export async function dispositivoConfiavel(userId: string): Promise<boolean> {
  const c = await cookies();
  return lerDispositivo(c.get(COOKIE_DISP)?.value) === userId;
}

export async function marcarDispositivoConfiavel(userId: string) {
  const c = await cookies();
  c.set(COOKIE_DISP, assinarDispositivo(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_DISP,
  });
}
