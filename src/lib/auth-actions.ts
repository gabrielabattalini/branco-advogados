"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { hashSenha, verificarSenha } from "@/lib/seguranca";
import { definirSessao, limparSessao, getSessao } from "@/lib/sessao";

export type ActionResult = { ok: true } | { ok: false; erro: string };

const DOMINIO = "@brancoadvogados.com";

// Rate limit de login — melhor-esforço, em memória do processo. Em serverless
// vale por instância ativa; para proteção forte (multi-instância) usar um store
// compartilhado tipo Upstash/Redis. Já eleva bastante a barra contra brute force.
const MAX_TENTATIVAS = 8;
const JANELA_MS = 15 * 60 * 1000;
const tentativasLogin = new Map<string, { count: number; ate: number }>();

function loginBloqueado(email: string): boolean {
  const t = tentativasLogin.get(email);
  if (!t) return false;
  if (Date.now() > t.ate) {
    tentativasLogin.delete(email);
    return false;
  }
  return t.count >= MAX_TENTATIVAS;
}

function registrarFalhaLogin(email: string) {
  const agora = Date.now();
  const t = tentativasLogin.get(email);
  if (!t || agora > t.ate) {
    tentativasLogin.set(email, { count: 1, ate: agora + JANELA_MS });
  } else {
    t.count += 1;
  }
}

function limparTentativasLogin(email: string) {
  tentativasLogin.delete(email);
}

// Iniciais a partir do nome (primeira letra do primeiro e do último nome).
function derivarIniciais(nome: string): string {
  const partes = nome
    .replace(/^(Dr\.|Dra\.|Est\.|Sr\.|Sra\.)\s*/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = partes[0]?.[0] ?? "U";
  const b =
    partes.length > 1 ? partes[partes.length - 1][0] : (partes[0]?.[1] ?? "");
  return (a + b).toUpperCase();
}

export async function entrar(input: {
  email: string;
  senha: string;
}): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.senha)
    return { ok: false, erro: "Informe e-mail e senha." };
  if (loginBloqueado(email))
    return {
      ok: false,
      erro: "Muitas tentativas. Tente novamente em alguns minutos.",
    };
  try {
    const u = await prisma.usuario.findUnique({ where: { email } });
    // Mensagem genérica de propósito (não revela se o e-mail existe).
    if (!u || !u.ativo || !verificarSenha(input.senha, u.senhaHash)) {
      registrarFalhaLogin(email);
      return { ok: false, erro: "E-mail ou senha incorretos." };
    }
    limparTentativasLogin(email);
    await definirSessao(u.id);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível entrar. Tente novamente." };
  }
}

export async function cadastrar(input: {
  nome: string;
  email: string;
  senha: string;
  area: string;
}): Promise<ActionResult> {
  const nome = input.nome.trim();
  const email = input.email.trim().toLowerCase();
  if (!nome || !email || !input.senha)
    return { ok: false, erro: "Preencha nome, e-mail e senha." };
  if (nome.length > 120)
    return { ok: false, erro: "Nome muito longo." };
  if (!email.endsWith(DOMINIO))
    return {
      ok: false,
      erro: `O cadastro é restrito a e-mails ${DOMINIO}.`,
    };
  if (input.senha.length < 8)
    return { ok: false, erro: "A senha deve ter ao menos 8 caracteres." };
  const area = input.area === "trabalhista" ? "trabalhista" : "civel";
  try {
    const u = await prisma.usuario.create({
      data: {
        nome,
        email,
        senhaHash: hashSenha(input.senha),
        area,
        papel: "advogado", // coordenador é atribuído, não auto-declarado
        iniciais: derivarIniciais(nome),
        ativo: true,
      },
    });
    await definirSessao(u.id);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false, erro: "Já existe uma conta com esse e-mail." };
    }
    return { ok: false, erro: "Não foi possível criar a conta." };
  }
}

export async function alterarSenha(input: {
  atual: string;
  nova: string;
}): Promise<ActionResult> {
  const s = await getSessao();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  if (input.nova.length < 8)
    return { ok: false, erro: "A nova senha deve ter ao menos 8 caracteres." };
  try {
    const u = await prisma.usuario.findUnique({ where: { id: s.id } });
    if (!u || !verificarSenha(input.atual, u.senhaHash)) {
      return { ok: false, erro: "Senha atual incorreta." };
    }
    await prisma.usuario.update({
      where: { id: s.id },
      data: { senhaHash: hashSenha(input.nova) },
    });
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível alterar a senha." };
  }
}

export async function sair() {
  await limparSessao();
  redirect("/login");
}
