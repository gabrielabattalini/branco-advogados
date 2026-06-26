// Cliente da API de Intimações da AASP (perfil associado). A chave fica em
// AASP_API_KEY (env, fora do Git). Usamos diferencial=false para LER as
// intimações SEM marcá-las como "baixadas" — não interfere no uso da AASP pelo
// escritório (site/app); a deduplicação fica por nossa conta.

import { hojeISO, addDiasISO } from "@/lib/hoje";
import type { IntimacaoAASP } from "@/lib/aasp";

const BASE = process.env.AASP_API_BASE || "https://intimacaoapi.aasp.org.br";
const KEY = process.env.AASP_API_KEY || "";

export function aaspConfigurada(): boolean {
  return KEY.length > 0;
}

// Intimações de UMA data de disponibilização (yyyy-mm-dd).
async function buscarData(dataISO: string): Promise<IntimacaoAASP[]> {
  const url = `${BASE}/api/Associado/intimacao/json?chave=${encodeURIComponent(
    KEY,
  )}&data=${dataISO}&diferencial=false`;
  const r = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; BrancoAdvogados/1.0)",
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`AASP HTTP ${r.status}`);
  const j = (await r.json()) as { intimacoes?: IntimacaoAASP[] };
  return Array.isArray(j?.intimacoes) ? j.intimacoes : [];
}

// Intimações dos últimos `dias` dias (inclui hoje). Um dia que falhar não
// derruba os demais.
export async function buscarIntimacoesRecentes(
  dias: number,
): Promise<IntimacaoAASP[]> {
  const hoje = hojeISO();
  const todas: IntimacaoAASP[] = [];
  for (let i = 0; i < dias; i++) {
    try {
      todas.push(...(await buscarData(addDiasISO(hoje, -i))));
    } catch {
      // ignora o dia que falhou
    }
  }
  return todas;
}
