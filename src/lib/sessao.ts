import { cookies } from "next/headers";

export type Papel = "advogado" | "coordenador";
export type AreaPerfil = "civel" | "trabalhista";

export type Sessao = {
  nome: string;
  email: string;
  area: AreaPerfil;
  papel: Papel;
  iniciais: string;
};

// Padrão até existir login Microsoft (usuário "atual" da demonstração).
const PADRAO: Sessao = {
  nome: "Gabriel Branco",
  email: "gabriel@brancoadvogados.com",
  area: "civel",
  papel: "coordenador",
  iniciais: "GB",
};

export async function getSessao(): Promise<Sessao> {
  const c = await cookies();
  return {
    nome: c.get("nome")?.value || PADRAO.nome,
    email: c.get("email")?.value || PADRAO.email,
    area: c.get("area")?.value === "trabalhista" ? "trabalhista" : "civel",
    papel: c.get("papel")?.value === "advogado" ? "advogado" : "coordenador",
    iniciais: PADRAO.iniciais,
  };
}

export async function getPapel(): Promise<Papel> {
  return (await getSessao()).papel;
}
