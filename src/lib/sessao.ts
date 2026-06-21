import { cookies } from "next/headers";

export type Papel = "advogado" | "coordenador";

/**
 * Perfil do "usuário atual". Enquanto não há login Microsoft, o perfil é
 * simulado por um cookie (alternável pelo seletor no topo). Padrão: coordenador.
 */
export async function getPapel(): Promise<Papel> {
  const store = await cookies();
  return store.get("papel")?.value === "advogado" ? "advogado" : "coordenador";
}
