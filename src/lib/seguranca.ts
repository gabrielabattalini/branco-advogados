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

// Chave HMAC para assinar o cookie de sessão. O correto é definir AUTH_SECRET
// (variável de ambiente dedicada). Sem ela, cai numa derivação de ÚLTIMO RECURSO
// só para o app não travar — mas aí a segurança da sessão passa a depender de
// outros segredos do ambiente. EM PRODUÇÃO: definir AUTH_SECRET na Vercel.
function chaveSessao(): Buffer {
  const segredo = process.env.AUTH_SECRET;
  if (segredo && segredo.length >= 16) {
    return createHash("sha256").update("branco:sessao:" + segredo).digest();
  }
  const base =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    "branco-dev-secret-fallback";
  return createHash("sha256").update("branco:sessao:fallback:" + base).digest();
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

export function assinarDispositivo(userId: string): string {
  const sig = createHmac("sha256", chaveSessao())
    .update("disp:" + userId)
    .digest("hex");
  return `${userId}.${sig}`;
}

export function lerDispositivo(token: string | undefined | null): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i <= 0) return null;
  const userId = token.slice(0, i);
  const sig = token.slice(i + 1);
  const esperado = createHmac("sha256", chaveSessao())
    .update("disp:" + userId)
    .digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? userId : null;
}
