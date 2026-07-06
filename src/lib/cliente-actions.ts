"use server";

import { prisma } from "@/lib/db";
import { hashSenha, verificarSenha } from "@/lib/seguranca";
import {
  definirSessaoCliente,
  limparSessaoCliente,
  getSessaoCliente,
} from "@/lib/sessao-cliente";
import { getSessao, ehGestor } from "@/lib/sessao";

export type ActionResult = { ok: true } | { ok: false; erro: string };

const MAX_FALHAS = 6;
const BLOQUEIO_MS = 10 * 60 * 1000; // 10 min

function normalizaLogin(v: string): string {
  return v
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9._-]+/g, "");
}

// ---- Cliente: login / logout / trocar senha ----

export async function entrarCliente(input: {
  login: string;
  senha: string;
}): Promise<ActionResult> {
  const login = normalizaLogin(input.login);
  if (!login || !input.senha)
    return { ok: false, erro: "Informe o acesso e a senha." };
  try {
    const cl = await prisma.clienteAcesso.findUnique({ where: { login } });
    if (cl?.bloqueadoAte && cl.bloqueadoAte.getTime() > Date.now())
      return {
        ok: false,
        erro: "Muitas tentativas. Tente novamente em alguns minutos.",
      };
    // Mensagem genérica de propósito (não revela se o acesso existe).
    if (!cl || !cl.ativo || !cl.senhaHash || !verificarSenha(input.senha, cl.senhaHash)) {
      if (cl && cl.ativo) {
        const t = (cl.tentativas ?? 0) + 1;
        await prisma.clienteAcesso.update({
          where: { id: cl.id },
          data:
            t >= MAX_FALHAS
              ? { tentativas: 0, bloqueadoAte: new Date(Date.now() + BLOQUEIO_MS) }
              : { tentativas: t },
        });
      }
      return { ok: false, erro: "Acesso ou senha incorretos." };
    }
    await prisma.clienteAcesso.update({
      where: { id: cl.id },
      data: {
        tentativas: 0,
        bloqueadoAte: null,
        ultimoAcesso: new Date(),
        acessos: { increment: 1 },
      },
    });
    await definirSessaoCliente(cl.id);
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível entrar. Tente novamente." };
  }
}

export async function sairCliente(): Promise<void> {
  await limparSessaoCliente();
}

export async function alterarSenhaCliente(input: {
  atual: string;
  nova: string;
}): Promise<ActionResult> {
  const s = await getSessaoCliente();
  if (!s) return { ok: false, erro: "Sessão expirada. Entre novamente." };
  if (!input.nova || input.nova.length < 6)
    return { ok: false, erro: "A nova senha deve ter ao menos 6 caracteres." };
  try {
    const cl = await prisma.clienteAcesso.findUnique({ where: { id: s.id } });
    if (!cl || !cl.senhaHash || !verificarSenha(input.atual, cl.senhaHash))
      return { ok: false, erro: "Senha atual incorreta." };
    await prisma.clienteAcesso.update({
      where: { id: cl.id },
      data: { senhaHash: hashSenha(input.nova) },
    });
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível alterar a senha." };
  }
}

// ---- Gestor: gerência das contas de acesso do portal ----

export async function criarAcessoCliente(input: {
  nomeCliente: string;
  login: string;
  senha: string;
}): Promise<ActionResult> {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel)) return { ok: false, erro: "Sem permissão." };
  const nomeCliente = input.nomeCliente.trim();
  const login = normalizaLogin(input.login);
  if (!nomeCliente) return { ok: false, erro: "Escolha o cliente." };
  if (login.length < 3)
    return { ok: false, erro: "O acesso deve ter ao menos 3 caracteres." };
  if (!input.senha || input.senha.length < 6)
    return { ok: false, erro: "A senha deve ter ao menos 6 caracteres." };
  try {
    const existe = await prisma.clienteAcesso.findUnique({ where: { login } });
    if (existe) return { ok: false, erro: "Já existe um acesso com esse identificador." };
    await prisma.clienteAcesso.create({
      data: { nomeCliente, login, senhaHash: hashSenha(input.senha) },
    });
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível criar o acesso." };
  }
}

export async function resetarSenhaCliente(input: {
  id: string;
  senha: string;
}): Promise<ActionResult> {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel)) return { ok: false, erro: "Sem permissão." };
  if (!input.senha || input.senha.length < 6)
    return { ok: false, erro: "A senha deve ter ao menos 6 caracteres." };
  try {
    await prisma.clienteAcesso.update({
      where: { id: input.id },
      data: { senhaHash: hashSenha(input.senha), tentativas: 0, bloqueadoAte: null },
    });
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível redefinir a senha." };
  }
}

export async function alternarAtivoCliente(id: string): Promise<ActionResult> {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel)) return { ok: false, erro: "Sem permissão." };
  try {
    const cl = await prisma.clienteAcesso.findUnique({
      where: { id },
      select: { ativo: true },
    });
    if (!cl) return { ok: false, erro: "Acesso não encontrado." };
    await prisma.clienteAcesso.update({
      where: { id },
      data: { ativo: !cl.ativo },
    });
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível atualizar o acesso." };
  }
}
