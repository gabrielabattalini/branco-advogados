// Criptografia de senha e assinatura do cookie de sessão.
// Apenas node:crypto — sem dependências e sem imports do Next (pode ser usado
// também no seed, que roda fora do runtime do Next).
import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";

// Chave HMAC para assinar o cookie de sessão. DEVE vir de AUTH_SECRET (variável
// de ambiente dedicada). Se AUTH_SECRET não estiver definida, usamos uma chave
// ALEATÓRIA gerada em memória — NUNCA derivada de segredo compartilhado (como a
// DATABASE_URL) nem de constante no código, para que os tokens não sejam
// forjáveis a partir do código-fonte (que é público). O custo do modo aleatório
// é que as sessões não sobrevivem a reinícios/instâncias — por isso AUTH_SECRET
// é obrigatória em produção (defina na Vercel).
let _chaveEfemera: Buffer | null = null;
function chaveSessao(): Buffer {
  const segredo = process.env.AUTH_SECRET;
  if (segredo && segredo.length >= 16) {
    return createHash("sha256").update("branco:sessao:" + segredo).digest();
  }
  if (!_chaveEfemera) {
    _chaveEfemera = createHash("sha256").update(randomBytes(32)).digest();
    console.warn(
      "[seguranca] AUTH_SECRET ausente/curta — usando chave de sessão EFÊMERA. " +
        "Defina AUTH_SECRET (>=16 chars) na Vercel; sem ela, os usuários são deslogados a cada deploy.",
    );
  }
  return _chaveEfemera;
}

// ---- Senha (scrypt + salt aleatório) ----

export function hashSenha(senha: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(senha, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verificarSenha(senha: string, guardado: string | null): boolean {
  if (!guardado) return false;
  const [saltHex, hashHex] = guardado.split(":");
  if (!saltHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  let calc: Buffer;
  try {
    calc = scryptSync(senha, Buffer.from(saltHex, "hex"), esperado.length);
  } catch {
    return false;
  }
  return calc.length === esperado.length && timingSafeEqual(calc, esperado);
}

// ---- Token de sessão (id do usuário + emissão, assinado com HMAC) ----
// Embute o instante de emissão (iat) e EXPIRA depois de MAX_SESSAO_MS, mesmo
// que o cookie sobreviva — expiração de verdade no servidor.
const MAX_SESSAO_MS = 14 * 24 * 60 * 60 * 1000; // 14 dias

export function assinarToken(userId: string): string {
  const corpo = `${userId}.${Date.now()}`;
  const sig = createHmac("sha256", chaveSessao()).update(corpo).digest("hex");
  return `${corpo}.${sig}`;
}

export function lerToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, iatStr, sig] = parts;
  if (!userId || !iatStr) return null;
  const esperado = createHmac("sha256", chaveSessao())
    .update(`${userId}.${iatStr}`)
    .digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const iat = Number(iatStr);
  if (!Number.isFinite(iat) || Date.now() - iat > MAX_SESSAO_MS) return null;
  return userId;
}

// ---- Código de verificação por e-mail (2FA do aparelho novo) ----

export function gerarCodigoLogin(): string {
  // 6 dígitos, sem viés de módulo (descarta o topo da faixa).
  let n = 0xffffffff;
  while (n >= 4_293_000_000) n = randomBytes(4).readUInt32BE(0);
  return String(n % 1_000_000).padStart(6, "0");
}

export function hashCodigo(codigo: string): string {
  const salt = randomBytes(16);
  const h = scryptSync(codigo, salt, 32);
  return `${salt.toString("hex")}:${h.toString("hex")}`;
}

export function conferirCodigo(codigo: string, guardado: string): boolean {
  const [saltHex, hashHex] = guardado.split(":");
  if (!saltHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  let calc: Buffer;
  try {
    calc = scryptSync(codigo, Buffer.from(saltHex, "hex"), esperado.length);
  } catch {
    return false;
  }
  return calc.length === esperado.length && timingSafeEqual(calc, esperado);
}

// ---- Token de "aparelho confiável" (pula o 2FA por ~60 dias) ----
// Embute o instante de emissão (iat) e EXPIRA no servidor depois de MAX_DISP_MS,
// mesmo que o cookie sobreviva — assim o token não é um "passe" permanente.
const MAX_DISP_MS = 60 * 24 * 60 * 60 * 1000; // 60 dias

export function assinarDispositivo(userId: string): string {
  const corpo = `${userId}.${Date.now()}`;
  const sig = createHmac("sha256", chaveSessao())
    .update("disp:" + corpo)
    .digest("hex");
  return `${corpo}.${sig}`;
}

export function lerDispositivo(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, iatStr, sig] = parts;
  if (!userId || !iatStr) return null;
  const esperado = createHmac("sha256", chaveSessao())
    .update(`disp:${userId}.${iatStr}`)
    .digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const iat = Number(iatStr);
  if (!Number.isFinite(iat) || Date.now() - iat > MAX_DISP_MS) return null;
  return userId;
}

// ---- Token de sessão do PORTAL DO CLIENTE (isolado da equipe) ----
// Prefixo "cli:" no HMAC garante que um token de cliente jamais seja aceito
// como sessão da equipe (e vice-versa), mesmo com a mesma chave.
const MAX_CLIENTE_MS = 14 * 24 * 60 * 60 * 1000; // 14 dias

export function assinarTokenCliente(id: string): string {
  const corpo = `${id}.${Date.now()}`;
  const sig = createHmac("sha256", chaveSessao())
    .update("cli:" + corpo)
    .digest("hex");
  return `${corpo}.${sig}`;
}

export function lerTokenCliente(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [id, iatStr, sig] = parts;
  if (!id || !iatStr) return null;
  const esperado = createHmac("sha256", chaveSessao())
    .update(`cli:${id}.${iatStr}`)
    .digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const iat = Number(iatStr);
  if (!Number.isFinite(iat) || Date.now() - iat > MAX_CLIENTE_MS) return null;
  return id;
}

// ---- Ticket de definição de senha (1º acesso / reset) ----
// Emitido só depois de o código por e-mail ser validado; autoriza a criação da
// senha por poucos minutos. Assinado com a mesma chave HMAC e com expiração.
const MAX_TICKET_MS = 15 * 60 * 1000; // 15 min

export function assinarTicketSenha(userId: string): string {
  const corpo = `${userId}.${Date.now()}`;
  const sig = createHmac("sha256", chaveSessao())
    .update("pwset:" + corpo)
    .digest("hex");
  return `${corpo}.${sig}`;
}

export function lerTicketSenha(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, iatStr, sig] = parts;
  if (!userId || !iatStr) return null;
  const esperado = createHmac("sha256", chaveSessao())
    .update(`pwset:${userId}.${iatStr}`)
    .digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const iat = Number(iatStr);
  if (!Number.isFinite(iat) || Date.now() - iat > MAX_TICKET_MS) return null;
  return userId;
}
