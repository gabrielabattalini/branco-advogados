// Papéis de acesso — módulo puro (sem deps de servidor), usável no client.

export type Papel = "advogado" | "coordenador" | "socio";

export const PAPEIS: Papel[] = ["socio", "coordenador", "advogado"];

export const LABEL_PAPEL: Record<string, string> = {
  socio: "Sócio diretor",
  coordenador: "Coordenador",
  advogado: "Advogado",
};

export function labelPapel(papel: string): string {
  return LABEL_PAPEL[papel] ?? "Advogado";
}

// Gestor = sócio diretor ou coordenador. Vê tudo, muda prazos, exclui tarefas e
// acessa a Administração (cadastrar usuários, mudar acessos).
export function ehGestor(papel: string | undefined): boolean {
  return papel === "socio" || papel === "coordenador";
}
