// Dados usados na Política de Privacidade e no canal de direitos do titular.
// Preencha CNPJ e o encarregado (DPO) via variáveis de ambiente na Vercel
// (LGPD_CNPJ, LGPD_DPO_NOME, LGPD_DPO_EMAIL) — ou edite os padrões abaixo.
export const LGPD = {
  controlador: "Branco Advogados Associados",
  cnpj: process.env.LGPD_CNPJ || "",
  encarregadoNome: process.env.LGPD_DPO_NOME || "",
  encarregadoEmail: process.env.LGPD_DPO_EMAIL || "privacidade@brancoadvogados.com.br",
  contatoEmail: "branco@brancoadvogados.com.br",
  telefone: "+55 (11) 4586-6329",
  endereco:
    "R. Dr. Edson Zardetto de Toledo, 145 — Chácara Urbana, Jundiaí/SP, CEP 13.209-120",
  atualizado: "julho de 2026",
};

// Placeholder visível quando um dado ainda não foi preenchido, para lembrar.
export function ou(valor: string, placeholder: string): string {
  return valor.trim() || `[${placeholder}]`;
}
