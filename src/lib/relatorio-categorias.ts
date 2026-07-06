// Modalidades de lançamento no relatório do cliente (seções).
// Módulo sem dependências de servidor — pode ser importado por client components.
export const CATEGORIAS_RELATORIO: { valor: string; rotulo: string }[] = [
  { valor: "judicial", rotulo: "Ações Judiciais" },
  { valor: "recuperacao_falencia", rotulo: "Recuperações Judiciais e Falências" },
  { valor: "procon", rotulo: "PROCON" },
  { valor: "administrativo", rotulo: "Atos Administrativos" },
  { valor: "outro", rotulo: "Outros" },
];

export const CATEGORIAS_VALIDAS = CATEGORIAS_RELATORIO.map((c) => c.valor);
