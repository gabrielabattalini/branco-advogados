export type Area = "trabalhista" | "civel";
export type Status = "a_fazer" | "em_curso" | "concluida";

/**
 * Classifica o processo a partir do número único do CNJ
 * (NNNNNNN-DD.AAAA.J.TR.OOOO). O dígito "J" identifica a Justiça:
 * 5 = Justiça do Trabalho (TRT/TST) → trabalhista; o resto → cível.
 */
export function classificarArea(numeroCnj: string): Area {
  const d = numeroCnj.replace(/\D/g, "");
  return d.charAt(13) === "5" ? "trabalhista" : "civel";
}

/** Dia "de hoje" da demonstração — alinhado ao calendário de Tarefas. */
export const HOJE_ISO = "2026-06-19";
export const HOJE_BR = "19/06/2026";

export const usuarioAtual = {
  nome: "Gabriel",
  iniciais: "GB",
  papel: "Advogado",
};

export type Tarefa = {
  id: string;
  titulo: string;
  processo: string;
  area: Area;
  prazo: string;
  prazoUrgente?: boolean;
  status: Status;
  responsavel: string;
};

export const tarefas: Tarefa[] = [
  { id: "1", titulo: "Elaborar contestação", processo: "0010567-89.2025.5.15.0042", area: "trabalhista", prazo: "Hoje", prazoUrgente: true, status: "a_fazer", responsavel: "AB" },
  { id: "2", titulo: "Juntar procuração e documentos", processo: "1001234-55.2024.8.26.0309", area: "civel", prazo: "23/06", status: "a_fazer", responsavel: "GB" },
  { id: "3", titulo: "Analisar despacho e dar ciência", processo: "0050123-44.2025.5.15.0010", area: "trabalhista", prazo: "24/06", status: "em_curso", responsavel: "PL" },
  { id: "4", titulo: "Protocolar cumprimento de sentença", processo: "1009876-12.2023.8.26.0114", area: "civel", prazo: "26/06", status: "a_fazer", responsavel: "CS" },
];

export type Evento = { hora: string; titulo: string; detalhe: string };

export const eventosHoje: Evento[] = [
  { hora: "09:30", titulo: "Reunião — Construtora Habita", detalhe: "Sala 2 · 1h" },
  { hora: "11:00", titulo: "Audiência — TRT15", detalhe: "Dr. Gabriel · trabalhista" },
  { hora: "15:00", titulo: "Alinhamento da equipe cível", detalhe: "Online · Teams" },
];

export type Publicacao = { titulo: string; numero: string; area: Area };

export const publicacoes: Publicacao[] = [
  { titulo: "TRT15 · Intimação", numero: "0050123-44.2025.5.15.0010", area: "trabalhista" },
  { titulo: "TJSP · Despacho", numero: "1001234-55.2024.8.26.0309", area: "civel" },
];

export const kpis = [
  { label: "Tarefas abertas", valor: 14 },
  { label: "Prazos hoje", valor: 3, danger: true },
  { label: "Publicações a triar", valor: 7 },
  { label: "Audiências na semana", valor: 5 },
];

export const statusLabel: Record<Status, string> = {
  a_fazer: "A fazer",
  em_curso: "Em curso",
  concluida: "Concluída",
};

export type TarefaFull = {
  id: string;
  titulo: string;
  processo: string;
  area: Area;
  data: string; // ISO yyyy-mm-dd
  prazo: string;
  prazoUrgente?: boolean;
  status: Status;
  responsavel: string;
};

export const semana = [
  { dow: "Seg", dia: "15", data: "2026-06-15", hoje: false },
  { dow: "Ter", dia: "16", data: "2026-06-16", hoje: false },
  { dow: "Qua", dia: "17", data: "2026-06-17", hoje: false },
  { dow: "Qui", dia: "18", data: "2026-06-18", hoje: false },
  { dow: "Sex", dia: "19", data: "2026-06-19", hoje: true },
];

export const tarefasFull: TarefaFull[] = [
  { id: "1", titulo: "Revisar contrato de locação", processo: "1005432-21.2024.8.26.0309", area: "civel", data: "2026-06-15", prazo: "15/06", status: "concluida", responsavel: "AB" },
  { id: "2", titulo: "Protocolar petição inicial", processo: "0010567-89.2025.5.15.0042", area: "trabalhista", data: "2026-06-16", prazo: "16/06", status: "concluida", responsavel: "GB" },
  { id: "3", titulo: "Juntar documentos do cliente", processo: "0010567-89.2025.5.15.0042", area: "trabalhista", data: "2026-06-17", prazo: "17/06", status: "em_curso", responsavel: "PL" },
  { id: "4", titulo: "Ligar para o cliente Aurora", processo: "1001234-55.2024.8.26.0309", area: "civel", data: "2026-06-17", prazo: "17/06", status: "a_fazer", responsavel: "GB" },
  { id: "5", titulo: "Calcular liquidação trabalhista", processo: "0050123-44.2025.5.15.0010", area: "trabalhista", data: "2026-06-18", prazo: "18/06", status: "a_fazer", responsavel: "CS" },
  { id: "6", titulo: "Analisar despacho e dar ciência", processo: "0050123-44.2025.5.15.0010", area: "trabalhista", data: "2026-06-19", prazo: "Hoje", prazoUrgente: true, status: "a_fazer", responsavel: "GB" },
  { id: "7", titulo: "Audiência Habita — preparar", processo: "1009876-12.2023.8.26.0114", area: "civel", data: "2026-06-19", prazo: "Hoje", prazoUrgente: true, status: "em_curso", responsavel: "AB" },
  { id: "8", titulo: "Elaborar contestação", processo: "0010567-89.2025.5.15.0042", area: "trabalhista", data: "2026-06-22", prazo: "22/06", status: "a_fazer", responsavel: "GB" },
];

export type TipoPessoa = "pf" | "pj";
export type TipoContato =
  | "cliente"
  | "parte_contraria"
  | "perito"
  | "correspondente";

export type Contato = {
  id: string;
  tipo: TipoPessoa;
  nome: string;
  documento: string;
  tipoContato: TipoContato;
  processos: number;
  iniciais: string;
};

export const contatos: Contato[] = [
  { id: "1", tipo: "pf", nome: "João da Silva", documento: "CPF 123.456.789-00", tipoContato: "cliente", processos: 2, iniciais: "JS" },
  { id: "2", tipo: "pj", nome: "Indústria Metalúrgica Zardetto Ltda", documento: "CNPJ 12.345.678/0001-90", tipoContato: "parte_contraria", processos: 1, iniciais: "IZ" },
  { id: "3", tipo: "pj", nome: "Construtora Habita S.A.", documento: "CNPJ 98.765.432/0001-10", tipoContato: "cliente", processos: 5, iniciais: "CH" },
  { id: "4", tipo: "pf", nome: "Maria Oliveira", documento: "CPF 987.654.321-00", tipoContato: "cliente", processos: 1, iniciais: "MO" },
  { id: "5", tipo: "pj", nome: "Condomínio Edifício Aurora", documento: "CNPJ 45.123.789/0001-55", tipoContato: "cliente", processos: 3, iniciais: "CA" },
  { id: "6", tipo: "pf", nome: "Ricardo Pereira", documento: "CPF 321.654.987-00", tipoContato: "perito", processos: 4, iniciais: "RP" },
  { id: "7", tipo: "pj", nome: "Comércio de Alimentos BomPreço Ltda", documento: "CNPJ 33.444.555/0001-22", tipoContato: "parte_contraria", processos: 1, iniciais: "CB" },
  { id: "8", tipo: "pf", nome: "Antônio Correia", documento: "CPF 222.333.444-55", tipoContato: "correspondente", processos: 8, iniciais: "AC" },
];

export type Processo = {
  id: string;
  numero: string;
  area: Area;
  tribunal: string;
  status: string;
  cliente: string;
  parteContraria: string;
  responsavel: string;
  responsavelIniciais: string;
  valorCausa: string;
  distribuido: string;
  fase: string;
};

export const processos: Processo[] = [
  { id: "p1", numero: "0010567-89.2025.5.15.0042", area: "trabalhista", tribunal: "TRT15 · 2ª Vara do Trabalho de Jundiaí", status: "Em andamento", cliente: "João da Silva", parteContraria: "Indústria Metalúrgica Zardetto Ltda", responsavel: "Dra. Ana Branco", responsavelIniciais: "AB", valorCausa: "R$ 85.000,00", distribuido: "12/03/2025", fase: "Conhecimento" },
  { id: "p2", numero: "1005432-21.2024.8.26.0309", area: "civel", tribunal: "TJSP · 3ª Vara Cível de Jundiaí", status: "Em andamento", cliente: "Condomínio Edifício Aurora", parteContraria: "Construtora Habita S.A.", responsavel: "Dr. Carlos Souza", responsavelIniciais: "CS", valorCausa: "R$ 240.000,00", distribuido: "21/08/2024", fase: "Conhecimento" },
  { id: "p3", numero: "0050123-44.2025.5.15.0010", area: "trabalhista", tribunal: "TRT15 · 10ª Vara do Trabalho de Campinas", status: "Em andamento", cliente: "Maria Oliveira", parteContraria: "Comércio de Alimentos BomPreço Ltda", responsavel: "Est. Pedro Lima", responsavelIniciais: "PL", valorCausa: "R$ 60.000,00", distribuido: "02/02/2025", fase: "Conhecimento" },
  { id: "p4", numero: "1009876-12.2023.8.26.0114", area: "civel", tribunal: "TJSP · 1ª Vara Cível de Jundiaí", status: "Em andamento", cliente: "Construtora Habita S.A.", parteContraria: "Município de Jundiaí", responsavel: "Dra. Ana Branco", responsavelIniciais: "AB", valorCausa: "R$ 120.000,00", distribuido: "10/05/2023", fase: "Cumprimento de sentença" },
  { id: "p5", numero: "1001234-55.2024.8.26.0309", area: "civel", tribunal: "TJSP · 2ª Vara Cível de Jundiaí", status: "Em andamento", cliente: "Maria Oliveira", parteContraria: "Banco Crédito S.A.", responsavel: "Dr. Carlos Souza", responsavelIniciais: "CS", valorCausa: "R$ 45.000,00", distribuido: "15/07/2024", fase: "Conhecimento" },
];

export type DocumentoProc = { ordem: string; nome: string; data: string };

export const documentosPorProcesso: Record<string, DocumentoProc[]> = {
  "0010567-89.2025.5.15.0042": [
    { ordem: "01", nome: "Procuração.pdf", data: "12/03/2025" },
    { ordem: "02", nome: "Contrato de trabalho.pdf", data: "14/03/2025" },
    { ordem: "03", nome: "Petição inicial.pdf", data: "18/03/2025" },
    { ordem: "04", nome: "Documentos pessoais.pdf", data: "18/03/2025" },
  ],
  "1005432-21.2024.8.26.0309": [
    { ordem: "01", nome: "Procuração.pdf", data: "21/08/2024" },
    { ordem: "02", nome: "Convenção de condomínio.pdf", data: "22/08/2024" },
    { ordem: "03", nome: "Petição inicial.pdf", data: "25/08/2024" },
  ],
};

export type PublicacaoProc = {
  titulo: string;
  origem: string;
  estado: "gerou_tarefa" | "arquivada";
};

export const publicacoesPorProcesso: Record<string, PublicacaoProc[]> = {
  "0010567-89.2025.5.15.0042": [
    { titulo: "Intimação para apresentar contestação", origem: "TRT15 · publicado 19/06/2026", estado: "gerou_tarefa" },
    { titulo: "Despacho de saneamento", origem: "TRT15 · publicado 02/05/2026", estado: "arquivada" },
  ],
};

export const responsaveis = [
  { iniciais: "AB", nome: "Dra. Ana Branco" },
  { iniciais: "GB", nome: "Dr. Gabriel" },
  { iniciais: "CS", nome: "Dr. Carlos Souza" },
  { iniciais: "PL", nome: "Est. Pedro Lima" },
];

export type EventoAgenda = {
  hora: string;
  tipo: "reuniao" | "audiencia" | "prazo" | "atendimento";
  titulo: string;
  detalhe: string;
  ini: string;
};

export const eventosAgenda: EventoAgenda[] = [
  { hora: "09:00", tipo: "reuniao", titulo: "Cliente — Construtora Habita", detalhe: "Sala 2 · 09:00 – 10:00 · Dra. Ana Branco", ini: "AB" },
  { hora: "10:30", tipo: "prazo", titulo: "Contestação — proc. …5.15.0042", detalhe: "Prazo fatal · Dr. Gabriel", ini: "GB" },
  { hora: "11:00", tipo: "audiencia", titulo: "TRT15 · 2ª Vara do Trabalho de Jundiaí", detalhe: "11:00 – 12:00 · Dr. Gabriel", ini: "GB" },
  { hora: "14:00", tipo: "reuniao", titulo: "Alinhamento da equipe cível", detalhe: "Online · Teams · 14:00 – 15:00", ini: "" },
  { hora: "16:00", tipo: "atendimento", titulo: "Novo cliente — Direito do Consumidor", detalhe: "Recepção · 16:00 · Est. Pedro Lima", ini: "PL" },
];

export type Intimacao = {
  id: string;
  tribunal: string;
  tipo: string;
  numero: string;
  area: Area;
  partes: string;
  despacho: string;
  prazo: string;
  processoCadastrado: boolean;
};

export const intimacoes: Intimacao[] = [
  { id: "i1", tribunal: "TRT15", tipo: "Intimação", numero: "0010567-89.2025.5.15.0042", area: "trabalhista", partes: "João da Silva × Indústria Metalúrgica Zardetto Ltda", despacho: "Intimação para apresentar contestação no prazo legal.", prazo: "04/07/2026", processoCadastrado: true },
  { id: "i2", tribunal: "TJSP", tipo: "Despacho", numero: "1005432-21.2024.8.26.0309", area: "civel", partes: "Condomínio Edifício Aurora × Construtora Habita S.A.", despacho: "Manifeste-se sobre os documentos juntados, em 5 dias.", prazo: "26/06/2026", processoCadastrado: true },
  { id: "i3", tribunal: "TRT15", tipo: "Sentença", numero: "0021987-54.2025.5.15.0010", area: "trabalhista", partes: "Maria Oliveira × Comércio de Alimentos BomPreço Ltda", despacho: "Sentença publicada — ciência às partes.", prazo: "30/06/2026", processoCadastrado: false },
];
