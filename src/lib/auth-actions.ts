"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import {
  hashSenha,
  verificarSenha,
  gerarCodigoLogin,
  hashCodigo,
  conferirCodigo,
  assinarTicketSenha,
  lerTicketSenha,
} from "@/lib/seguranca";
import {
  definirSessao,
  limparSessao,
  getSessao,
  ehGestor,
  dispositivoConfiavel,
  marcarDispositivoConfiavel,
} from "@/lib/sessao";
import {
  emailConfigurado,
  enviarCodigoLogin,
  enviarAvisoAparelho,
} from "@/lib/email";

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

// Bloqueio por conta (persistente, vale entre instâncias) + validade do código.
const MAX_FALHAS = 5;
const BLOQUEIO_MS = 15 * 60 * 1000;
const CODIGO_VALIDADE_MS = 10 * 60 * 1000;
const MAX_TENT_CODIGO = 5;

function resumoNavegador(ua: string): string {
  if (!ua) return "";
  const nav = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Navegador";
  const so = /Windows/.test(ua)
    ? "Windows"
    : /iPhone|iPad/.test(ua)
      ? "iPhone/iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Mac OS X/.test(ua)
          ? "Mac"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return [nav, so].filter(Boolean).join(" · ");
}

async function infoReq(): Promise<{ ip: string; navegador: string }> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim();
  return { ip: ip.slice(0, 60), navegador: resumoNavegador(h.get("user-agent") || "") };
}

async function registrarLog(
  evento: string,
  email: string,
  usuarioId: string | null,
  info: { ip: string; navegador: string },
) {
  try {
    await prisma.loginLog.create({
      data: {
        evento,
        email: email.slice(0, 160),
        usuarioId: usuarioId ?? undefined,
        ip: info.ip,
        navegador: info.navegador,
      },
    });
  } catch {
    // log é melhor-esforço; nunca derruba o login
  }
}

export type LoginResult =
  | { ok: true }
  | { ok: false; erro: string }
  | { precisaCodigo: true; email: string; primeiroAcesso?: boolean }
  | { precisaDefinirSenha: true; email: string; ticket: string };

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

// Gera, guarda e envia um novo código de 6 dígitos por e-mail. Retorna se saiu.
async function enviarNovoCodigo(u: { id: string; email: string; nome: string }): Promise<boolean> {
  const codigo = gerarCodigoLogin();
  await prisma.codigoLogin.deleteMany({ where: { usuarioId: u.id } });
  await prisma.codigoLogin.create({
    data: {
      usuarioId: u.id,
      codigoHash: hashCodigo(codigo),
      expiraEm: new Date(Date.now() + CODIGO_VALIDADE_MS),
    },
  });
  const envio = await enviarCodigoLogin(u.email, codigo, u.nome);
  return envio.enviado;
}

export async function entrar(input: {
  email: string;
  senha: string;
}): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, erro: "Informe o e-mail." };
  const info = await infoReq();
  if (loginBloqueado(email)) {
    await registrarLog("bloqueado", email, null, info);
    return {
      ok: false,
      erro: "Muitas tentativas. Tente novamente em alguns minutos.",
    };
  }
  try {
    const u = await prisma.usuario.findUnique({ where: { email } });
    // Bloqueio de conta por tentativas (anti-bruteforce persistente).
    if (u && u.bloqueadoAte && u.bloqueadoAte.getTime() > Date.now()) {
      await registrarLog("bloqueado", email, u.id, info);
      // Mensagem IDÊNTICA à do rate-limit em memória — não revela se a conta
      // existe (antes, "Conta bloqueada..." denunciava e-mails válidos).
      return {
        ok: false,
        erro: "Muitas tentativas. Tente novamente em alguns minutos.",
      };
    }
    // PRIMEIRO ACESSO: conta ativa e SEM senha definida (senhaHash nulo). Não há
    // senha padrão — a pessoa recebe um código por e-mail e cria a própria senha.
    if (u && u.ativo && !u.senhaHash) {
      if (!emailConfigurado()) {
        return {
          ok: false,
          erro: "Primeiro acesso indisponível: envio de e-mail não configurado. Contate o administrador.",
        };
      }
      const enviado = await enviarNovoCodigo(u);
      if (!enviado)
        return { ok: false, erro: "Não foi possível enviar o código agora. Tente em instantes." };
      await registrarLog("codigo_enviado", email, u.id, info);
      return { precisaCodigo: true, email, primeiroAcesso: true };
    }
    // A partir daqui, fluxo com senha — exige senha preenchida.
    if (!input.senha) return { ok: false, erro: "E-mail ou senha incorretos." };
    // Mensagem genérica de propósito (não revela se o e-mail existe).
    if (!u || !u.ativo || !verificarSenha(input.senha, u.senhaHash)) {
      registrarFalhaLogin(email);
      if (u && u.ativo) {
        const t = (u.tentativasLogin ?? 0) + 1;
        await prisma.usuario.update({
          where: { id: u.id },
          data:
            t >= MAX_FALHAS
              ? { tentativasLogin: 0, bloqueadoAte: new Date(Date.now() + BLOQUEIO_MS) }
              : { tentativasLogin: t },
        });
      }
      await registrarLog("senha_errada", email, u?.id ?? null, info);
      return { ok: false, erro: "E-mail ou senha incorretos." };
    }
    // Senha correta — zera contadores de tentativa.
    limparTentativasLogin(email);
    if (u.tentativasLogin || u.bloqueadoAte)
      await prisma.usuario.update({
        where: { id: u.id },
        data: { tentativasLogin: 0, bloqueadoAte: null },
      });
    // Aparelho já confiável → entra direto.
    if (await dispositivoConfiavel(u.id)) {
      await definirSessao(u.id);
      await registrarLog("sucesso", email, u.id, info);
      revalidatePath("/", "layout");
      return { ok: true };
    }
    // Aparelho novo → exige código por e-mail. Se o envio de e-mail não estiver
    // configurado, não dá pra mandar o código: entra e confia no aparelho (não
    // trava ninguém de fora). Ligue RESEND_API_KEY para ativar o 2FA de fato.
    if (!emailConfigurado()) {
      await definirSessao(u.id);
      await marcarDispositivoConfiavel(u.id);
      await registrarLog("sucesso", email, u.id, info);
      revalidatePath("/", "layout");
      return { ok: true };
    }
    const enviado = await enviarNovoCodigo(u);
    // NOTA DE SEGURANÇA (fail-open conhecido): se o código não puder ser enviado
    // (e-mail mal configurado / domínio de teste), hoje o login entra e confia no
    // aparelho para não travar ninguém. O correto é FAIL-CLOSED (negar), mas isso
    // só deve ser ligado depois de confirmar que o RESEND entrega de verdade —
    // senão um e-mail quebrado tranca todos. Ativar quando o 2FA estiver validado.
    if (!enviado) {
      await prisma.codigoLogin.deleteMany({ where: { usuarioId: u.id } });
      await definirSessao(u.id);
      await marcarDispositivoConfiavel(u.id);
      await registrarLog("sucesso", email, u.id, info);
      revalidatePath("/", "layout");
      return { ok: true };
    }
    await registrarLog("codigo_enviado", email, u.id, info);
    return { precisaCodigo: true, email };
  } catch {
    return { ok: false, erro: "Não foi possível entrar. Tente novamente." };
  }
}

// Confere o código de 6 dígitos do aparelho novo. Em sucesso, cria a sessão,
// marca o aparelho como confiável (~60 dias) e avisa por e-mail.
export async function verificarCodigoLogin(input: {
  email: string;
  codigo: string;
}): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();
  const codigo = (input.codigo || "").replace(/\D/g, "").slice(0, 6);
  const info = await infoReq();
  if (codigo.length !== 6)
    return { ok: false, erro: "Digite o código de 6 dígitos." };
  try {
    const u = await prisma.usuario.findUnique({ where: { email } });
    if (!u || !u.ativo)
      return { ok: false, erro: "Sessão inválida. Faça login novamente." };
    const cod = await prisma.codigoLogin.findFirst({
      where: { usuarioId: u.id },
      orderBy: { criadoEm: "desc" },
    });
    if (!cod || cod.expiraEm.getTime() < Date.now())
      return {
        ok: false,
        erro: "Código expirado. Faça login de novo para receber outro.",
      };
    if (cod.tentativas >= MAX_TENT_CODIGO) {
      await prisma.codigoLogin.deleteMany({ where: { usuarioId: u.id } });
      return { ok: false, erro: "Muitas tentativas. Faça login de novo." };
    }
    if (!conferirCodigo(codigo, cod.codigoHash)) {
      await prisma.codigoLogin.update({
        where: { id: cod.id },
        data: { tentativas: cod.tentativas + 1 },
      });
      await registrarLog("codigo_errado", email, u.id, info);
      return { ok: false, erro: "Código incorreto." };
    }
    await prisma.codigoLogin.deleteMany({ where: { usuarioId: u.id } });
    // PRIMEIRO ACESSO: código validado, mas a conta ainda não tem senha. Não cria
    // sessão aqui — devolve um ticket curto (15 min) que autoriza definir a senha.
    if (!u.senhaHash) {
      return { precisaDefinirSenha: true, email, ticket: assinarTicketSenha(u.id) };
    }
    await definirSessao(u.id);
    await marcarDispositivoConfiavel(u.id);
    await registrarLog("novo_aparelho", email, u.id, info);
    enviarAvisoAparelho(
      u.email,
      u.nome,
      new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      info.navegador,
    ).catch(() => {});
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível validar o código." };
  }
}

// 1º acesso: com o ticket (emitido após o código de e-mail), a pessoa define a
// própria senha. Só então cria a sessão e confia no aparelho.
export async function definirSenhaPrimeiroAcesso(input: {
  email: string;
  ticket: string;
  senha: string;
}): Promise<LoginResult> {
  const email = input.email.trim().toLowerCase();
  const userId = lerTicketSenha(input.ticket);
  if (!userId)
    return { ok: false, erro: "Tempo esgotado. Faça o login de novo para receber outro código." };
  if (!input.senha || input.senha.length < 8)
    return { ok: false, erro: "A senha deve ter ao menos 8 caracteres." };
  try {
    const u = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!u || !u.ativo || u.email.toLowerCase() !== email)
      return { ok: false, erro: "Sessão inválida. Faça o login de novo." };
    await prisma.usuario.update({
      where: { id: u.id },
      data: {
        senhaHash: hashSenha(input.senha),
        tentativasLogin: 0,
        bloqueadoAte: null,
      },
    });
    const info = await infoReq();
    await definirSessao(u.id);
    await marcarDispositivoConfiavel(u.id);
    await registrarLog("sucesso", email, u.id, info);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível definir a senha." };
  }
}

// Gestor: zera a senha de um usuário (senhaHash nulo), forçando o fluxo de 1º
// acesso por e-mail. É como a senha antiga "Branco@2026" deve ser aposentada.
export async function resetarParaPrimeiroAcesso(userId: string): Promise<ActionResult> {
  const s = await getSessao();
  if (!s || !ehGestor(s.papel))
    return { ok: false, erro: "Sem permissão." };
  try {
    const u = await prisma.usuario.findUnique({ where: { id: userId }, select: { id: true } });
    if (!u) return { ok: false, erro: "Usuário não encontrado." };
    await prisma.usuario.update({
      where: { id: userId },
      data: { senhaHash: null, tentativasLogin: 0, bloqueadoAte: null },
    });
    await prisma.codigoLogin.deleteMany({ where: { usuarioId: userId } });
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, erro: "Não foi possível resetar a senha." };
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
