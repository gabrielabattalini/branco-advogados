"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { hashSenha, verificarSenha } from "@/lib/seguranca";
import { definirSessao, limparSessao, getSessao, ehGestor } from "@/lib/sessao";

export type ActionResult = { ok: true } | { ok: false; erro: string };

const DOMINIO = "@brancoadvogados.com";
const PAPEIS_VALIDOS = ["socio", "coordenador", "advogado"];

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

// Iniciais a partir do nome (sem acentos; 1ª letra do primeiro e do último nome).
function baseIniciais(nome: string): string {
  const partes = nome
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/^(Dr\.|Dra\.|Est\.|Sr\.|Sra\.)\s*/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = partes[0]?.[0] ?? "U";
  const b =
    partes.length > 1 ? partes[partes.length - 1][0] : (partes[0]?.[1] ?? "X");
  return (a + b).toUpperCase();
}

// Garante iniciais únicas no banco (evita colisão no escopo de tarefas/agenda).
async function iniciaisUnicas(nome: string): Promise<string> {
  const existentes = new Set(
    (await prisma.usuario.findMany({ select: { iniciais: true } })).map(
      (u) => u.iniciais,
    ),
  );
  const base = baseIniciais(nome);
  if (!existentes.has(base)) return base;
  for (let i = 2; i < 100; i++) {
    const cand = base + i;
    if (!existentes.has(cand)) return cand;
  }
  return base + Date.now();
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
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      try {
        const u = await prisma.usuario.create({
          data: {
            nome,
            email,
            senhaHash: hashSenha(input.senha),
            area,
            papel: "advogado", // coordenador é atribuído, não auto-declarado
            iniciais: await iniciaisUnicas(nome),
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
          const alvo = String(e.meta?.target ?? "");
          if (alvo.includes("email"))
            return { ok: false, erro: "Já existe uma conta com esse e-mail." };
          if (alvo.includes("iniciais")) continue; // colisão de iniciais — recalcula
        }
        throw e;
      }
    }
    return {
      ok: false,
      erro: "Não foi possível gerar iniciais únicas. Tente novamente.",
    };
  } catch {
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

// ---- Administração de usuários (gestores: sócio diretor + coordenadores) ----

export async function criarUsuario(input: {
  nome: string;
  email: string;
  senha: string;
  area: string;
  papel: string;
}): Promise<ActionResult> {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel))
    return { ok: false, erro: "Sem permissão para esta ação." };
  const nome = input.nome.trim();
  const email = input.email.trim().toLowerCase();
  if (!nome || !email || !input.senha)
    return { ok: false, erro: "Preencha nome, e-mail e senha." };
  if (nome.length > 120) return { ok: false, erro: "Nome muito longo." };
  if (!email.endsWith(DOMINIO))
    return { ok: false, erro: `O e-mail deve ser ${DOMINIO}.` };
  if (input.senha.length < 8)
    return { ok: false, erro: "A senha deve ter ao menos 8 caracteres." };
  let papel = PAPEIS_VALIDOS.includes(input.papel) ? input.papel : "advogado";
  // Só o Sócio diretor pode criar outro Sócio diretor.
  if (papel === "socio" && s.papel !== "socio") papel = "coordenador";
  const area = input.area === "trabalhista" ? "trabalhista" : "civel";
  try {
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      try {
        await prisma.usuario.create({
          data: {
            nome,
            email,
            senhaHash: hashSenha(input.senha),
            area,
            papel,
            iniciais: await iniciaisUnicas(nome),
            ativo: true,
          },
        });
        revalidatePath("/admin");
        revalidatePath("/", "layout");
        return { ok: true };
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002"
        ) {
          const alvo = String(e.meta?.target ?? "");
          if (alvo.includes("email"))
            return { ok: false, erro: "Já existe uma conta com esse e-mail." };
          if (alvo.includes("iniciais")) continue; // colisão de iniciais — recalcula
        }
        throw e;
      }
    }
    return {
      ok: false,
      erro: "Não foi possível gerar iniciais únicas. Tente novamente.",
    };
  } catch {
    return { ok: false, erro: "Não foi possível criar o usuário." };
  }
}

export async function alterarPapel(input: {
  id: string;
  papel: string;
}): Promise<ActionResult> {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel))
    return { ok: false, erro: "Sem permissão para esta ação." };
  if (!PAPEIS_VALIDOS.includes(input.papel))
    return { ok: false, erro: "Tipo de acesso inválido." };
  if (input.id === s.id)
    return { ok: false, erro: "Você não pode alterar o seu próprio acesso." };
  try {
    const alvo = await prisma.usuario.findUnique({
      where: { id: input.id },
      select: { papel: true },
    });
    if (!alvo) return { ok: false, erro: "Usuário não encontrado." };
    // Só o Sócio diretor mexe no acesso de sócios (protege a direção).
    if (
      s.papel !== "socio" &&
      (alvo.papel === "socio" || input.papel === "socio")
    )
      return {
        ok: false,
        erro: "Apenas o Sócio diretor pode definir esse acesso.",
      };
    // Não remover o último Sócio diretor ativo (evita lockout da administração).
    if (alvo.papel === "socio" && input.papel !== "socio") {
      const sociosAtivos = await prisma.usuario.count({
        where: { papel: "socio", ativo: true },
      });
      if (sociosAtivos <= 1)
        return { ok: false, erro: "Não é possível remover o único Sócio diretor." };
    }
    await prisma.usuario.update({
      where: { id: input.id },
      data: { papel: input.papel },
    });
    revalidatePath("/admin");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível alterar o acesso." };
  }
}

export async function alternarAtivo(input: {
  id: string;
  ativo: boolean;
}): Promise<ActionResult> {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel))
    return { ok: false, erro: "Sem permissão para esta ação." };
  if (input.id === s.id)
    return { ok: false, erro: "Você não pode desativar a sua própria conta." };
  try {
    const alvo = await prisma.usuario.findUnique({
      where: { id: input.id },
      select: { papel: true },
    });
    if (!alvo) return { ok: false, erro: "Usuário não encontrado." };
    if (s.papel !== "socio" && alvo.papel === "socio")
      return {
        ok: false,
        erro: "Apenas o Sócio diretor pode alterar essa conta.",
      };
    // Não desativar o último Sócio diretor ativo (evita lockout da administração).
    if (!input.ativo && alvo.papel === "socio") {
      const sociosAtivos = await prisma.usuario.count({
        where: { papel: "socio", ativo: true },
      });
      if (sociosAtivos <= 1)
        return {
          ok: false,
          erro: "Não é possível desativar o único Sócio diretor ativo.",
        };
    }
    await prisma.usuario.update({
      where: { id: input.id },
      data: { ativo: input.ativo },
    });
    revalidatePath("/admin");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível alterar o usuário." };
  }
}

export async function editarUsuario(input: {
  id: string;
  nome: string;
  email: string;
  area: string;
  novaSenha?: string;
}): Promise<ActionResult> {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel))
    return { ok: false, erro: "Sem permissão para esta ação." };
  const nome = input.nome.trim();
  const email = input.email.trim().toLowerCase();
  if (!nome || !email) return { ok: false, erro: "Preencha nome e e-mail." };
  if (nome.length > 120) return { ok: false, erro: "Nome muito longo." };
  if (!email.endsWith(DOMINIO))
    return { ok: false, erro: `O e-mail deve ser ${DOMINIO}.` };
  if (input.novaSenha && input.novaSenha.length < 8)
    return { ok: false, erro: "A nova senha deve ter ao menos 8 caracteres." };
  try {
    const alvo = await prisma.usuario.findUnique({
      where: { id: input.id },
      select: { papel: true },
    });
    if (!alvo) return { ok: false, erro: "Usuário não encontrado." };
    // Só o Sócio diretor edita a conta de outro sócio (protege a direção).
    if (s.papel !== "socio" && alvo.papel === "socio" && input.id !== s.id)
      return {
        ok: false,
        erro: "Apenas o Sócio diretor pode alterar essa conta.",
      };
    const area = input.area === "trabalhista" ? "trabalhista" : "civel";
    await prisma.usuario.update({
      where: { id: input.id },
      data: {
        nome,
        email,
        area,
        ...(input.novaSenha ? { senhaHash: hashSenha(input.novaSenha) } : {}),
      },
    });
    revalidatePath("/admin");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { ok: false, erro: "Já existe uma conta com esse e-mail." };
    return { ok: false, erro: "Não foi possível salvar o usuário." };
  }
}

export async function sair() {
  await limparSessao();
  redirect("/login");
}
