import JSZip from "jszip";

// ---------- Word (.docx) → texto ----------
export async function docxParaTexto(buf: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buf);
  const f = zip.file("word/document.xml");
  if (!f) return "";
  let xml = await f.async("string");
  xml = xml.replace(/<\/w:p>/g, "\n").replace(/<w:tab[^>]*\/>/g, "  ");
  return xml
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n");
}

// ---------- Word (.docx) → tabelas ----------
// Cada tabela vira uma matriz de linhas; cada célula é um array de linhas de texto.
export async function docxParaTabelas(
  buf: ArrayBuffer,
): Promise<string[][][]> {
  const zip = await JSZip.loadAsync(buf);
  const f = zip.file("word/document.xml");
  if (!f) return [];
  const xml = await f.async("string");
  const limpar = (tc: string): string[] => {
    const x = tc.replace(/<\/w:p>/g, "\n").replace(/<w:tab[^>]*\/>/g, "  ");
    return x
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  };
  const tabelas: string[][][] = [];
  for (const tbl of xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) ?? []) {
    const linhas: string[][] = [];
    for (const tr of tbl.match(/<w:tr[ >][\s\S]*?<\/w:tr>/g) ?? []) {
      const celulas = [...tr.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((m) =>
        limpar(m[0]).join("\n"),
      );
      linhas.push(celulas);
    }
    tabelas.push(linhas);
  }
  return tabelas;
}

// Relatório em formato de TABELA (ex.: LOMA — "Ações Judiciais").
// Colunas: N. | PARTES | AÇÃO | PROCESSO/VARA + DISTR. | VALOR | FASE ATUAL.
const CNJ_RE = /\d{7}-?\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/;
// Nota: usamos um lookahead (não \b) porque \b não reconhece limites após
// letras acentuadas em JS (ex.: "Ré:" falharia com \b).
const TIPO_PARTE_RE =
  /^(Autora?|R[ée]u?s?|Exequente|Execut[ao]d?[ao]?|Embargantes?|Requerentes?|Requerid[ao]s?|Reclamantes?|Reclamad[ao]s?|Impetrantes?)(?=[\s:.)\-]|$)/i;

export function parseRelatorioTabela(
  tabelas: string[][][],
): RelatorioImportado | null {
  // Acha a tabela de ações judiciais pelo cabeçalho (PARTES + FASE ATUAL).
  let cliente = "";
  const processos: ProcessoImportado[] = [];
  for (const tab of tabelas) {
    // Cliente: costuma estar na 1ª célula da tabela ("CLIENTE: ...").
    if (!cliente) {
      const topo = (tab[0]?.[0] ?? "").split("\n");
      const l = topo.find((x) => /CLIENTE\s*:/i.test(x));
      if (l) {
        cliente = l
          .replace(/.*CLIENTE\s*:/i, "")
          .replace(/\s{2,}.*$/, "") // corta a data/coluna à direita
          .replace(/\s+(JANEIRO|FEVEREIRO|MAR[ÇC]O|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO)\s+DE\s+\d{4}.*/i, "")
          .trim();
      }
    }
    const headerRow = tab.find(
      (r) =>
        r.length >= 5 &&
        r.some((c) => /PARTES/i.test(c)) &&
        r.some((c) => /FASE ATUAL/i.test(c)),
    );
    if (!headerRow) continue;
    const hi = tab.indexOf(headerRow);
    for (let ri = hi + 1; ri < tab.length; ri++) {
      const cells = tab[ri];
      if (cells.length < 6) continue;
      const [nCol, partes, acao, procVara, valor, fase] = cells.map((c) =>
        c.split("\n"),
      );
      const num = (nCol[0] ?? "").trim();
      if (!/^\d+$/.test(num)) continue; // pula linhas que não são de processo
      const cnjLine = procVara.find((l) => CNJ_RE.test(l)) ?? "";
      const cnj = cnjLine.match(CNJ_RE)?.[0] ?? "";
      if (!cnj) continue; // sem número CNJ → ainda não é processo
      const vara = procVara
        .filter((l) => !CNJ_RE.test(l) && !/^\d{2}\/\d{2}\/\d{4}$/.test(l))
        .join(" ")
        .trim();
      const distr = procVara.find((l) => /^\d{2}\/\d{2}\/\d{4}$/.test(l)) ?? "";
      const parteRaw = partes.join(" ").trim();
      const tipo = (parteRaw.match(TIPO_PARTE_RE)?.[0] ?? "").trim();
      const parte = parteRaw.replace(TIPO_PARTE_RE, "").replace(/^\s*:?\s*/, "").trim();
      processos.push({
        numero: cnj,
        parteContrariaTipo: tipo,
        parteContraria: parte,
        juizo: vara,
        sinteseDoPedido: acao.join(" ").trim(),
        // FASE ATUAL: cada linha é um andamento; guardamos separados por "\n".
        status: fase.map((l) => l.trim()).filter(Boolean).join("\n"),
        valorCausa: valor.join(" ").replace(/\s+/g, " ").trim(),
        audiencia: "",
      });
    }
  }
  if (processos.length === 0) return null;
  return { cliente: cliente || "", processos };
}

// ---------- Relatório .docx → estrutura ----------
export type ProcessoImportado = {
  numero: string;
  parteContrariaTipo: string;
  parteContraria: string;
  juizo: string;
  sinteseDoPedido: string;
  status: string;
  valorCausa: string;
  audiencia: string;
  categoria?: string; // judicial (padrão) | recuperacao_falencia
};
export type RelatorioImportado = {
  cliente: string;
  processos: ProcessoImportado[];
};

// Seção "RECUPERAÇÃO JUDICIAL / FALÊNCIA" (tabela ao fim de muitos relatórios).
// Colunas: Nº | Ré: nome | CNJ + Vara + Dist. | Valor | Andamento(status).
export function parseRecuperacaoFalencia(
  tabelas: string[][][],
): ProcessoImportado[] {
  const out: ProcessoImportado[] = [];
  for (const tab of tabelas) {
    const cabecalho = tab
      .slice(0, 2)
      .flat()
      .join(" ")
      .toUpperCase();
    if (!/RECUPERA[ÇC][ÃA]O JUDICIAL|FAL[ÊE]NCIA/.test(cabecalho)) continue;
    for (const cells of tab) {
      const linhas = cells.map((c) => c.split("\n"));
      // Célula com o CNJ (processo/vara/dist).
      const procIdx = cells.findIndex((c) => CNJ_RE.test(c));
      if (procIdx < 0) continue;
      const procCell = linhas[procIdx];
      const cnj = (procCell.find((l) => CNJ_RE.test(l)) ?? "").match(CNJ_RE)?.[0] ?? "";
      if (!cnj) continue;
      // Parte: célula com "Ré:/Autor:/..." (ou a imediatamente antes do CNJ).
      const parteCell =
        cells.find((c) => TIPO_PARTE_RE.test(c.trim())) ??
        cells[procIdx - 1] ??
        "";
      const parteRaw = parteCell.replace(/\n/g, " ").trim();
      const tipo = (parteRaw.match(TIPO_PARTE_RE)?.[0] ?? "").trim();
      const parte = parteRaw.replace(TIPO_PARTE_RE, "").replace(/^\s*:?\s*/, "").trim();
      // Vara e distribuição (linhas do proc. que não são o CNJ).
      const vara = procCell
        .filter((l) => !CNJ_RE.test(l) && !/^Dist/i.test(l))
        .join(" ")
        .trim();
      // Valor: célula com "R$".
      const valor = (cells.find((c, i) => i !== procIdx && /R\$/.test(c)) ?? "")
        .replace(/\s+/g, " ")
        .trim();
      // Andamento: a maior célula que não é parte/proc/valor/número.
      const status = cells
        .filter(
          (c, i) =>
            i !== procIdx &&
            c !== parteCell &&
            !/^\s*\d{1,3}\s*$/.test(c) &&
            !/^R\$[\d\s.,]*$/.test(c.trim()),
        )
        .sort((a, b) => b.length - a.length)[0] ?? "";
      out.push({
        numero: cnj,
        parteContrariaTipo: tipo || "Ré",
        parteContraria: parte,
        juizo: vara,
        sinteseDoPedido: "",
        status: status.split("\n").map((l) => l.trim()).filter(Boolean).join("\n"),
        valorCausa: valor,
        audiencia: "",
        categoria: "recuperacao_falencia",
      });
    }
  }
  return out;
}

const PROC =
  /PROCESSO\s*n[ºo.:\s]*\s*(\d{7}-?\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/gi;
const L_SINT = /S[ÍI]NTESE DO PEDIDO/i;
const L_STAT = /SITUA[ÇC][ÃA]O ATUAL(?:\s*\(STATUS\))?/i;
const L_VAL = /VALOR\s*(?:DA)?\s*CAUSA/i;
const L_AUD = /AUDI[ÊE]NCIA/i;
const L_OBS = /OBSERVA[ÇC][ÕO]ES/i;
const L_JUI = /JU[ÍI]ZO/i;

function campo(s: string, label: RegExp, ate: RegExp[]): string {
  const i = s.search(label);
  if (i < 0) return "";
  const r = s.slice(i).replace(label, "");
  let fim = r.length;
  for (const a of ate) {
    const j = r.search(a);
    if (j >= 0 && j < fim) fim = j;
  }
  return r
    .slice(0, fim)
    .replace(/^[\s:.)\-–]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseRelatorioDocx(text: string): RelatorioImportado {
  const cliM = text.match(/CLIENTE\s*:?\s*(.+)/i);
  const cliente = cliM ? cliM[1].replace(/\s*[(–-].*$/, "").trim() : "";
  const ms = [...text.matchAll(PROC)];
  const processos: ProcessoImportado[] = [];
  for (let i = 0; i < ms.length; i++) {
    const idx = ms[i].index ?? 0;
    const numero = ms[i][1];
    const nxt = i + 1 < ms.length ? (ms[i + 1].index ?? text.length) : text.length;
    const prv = i > 0 ? (ms[i - 1].index ?? 0) : 0;
    const region = text.slice(idx, nxt);
    // parte contrária: ocorrência mais próxima do número (antes ou depois).
    const cands = [
      ...text
        .slice(prv, nxt)
        .matchAll(/PARTE CONTR[ÁA]RIA\s*(?:\(([^)]*)\))?\s*:?\s*([^\n]+)/gi),
    ].map((m) => ({
      pos: prv + (m.index ?? 0),
      tipo: (m[1] || "").trim(),
      nome: m[2].split(/PROCESSO|JU[ÍI]ZO/i)[0].trim(),
    }));
    let parteContraria = "";
    let parteContrariaTipo = "";
    if (cands.length) {
      cands.sort((a, b) => Math.abs(a.pos - idx) - Math.abs(b.pos - idx));
      parteContraria = cands[0].nome;
      parteContrariaTipo = cands[0].tipo;
    }
    processos.push({
      numero,
      parteContrariaTipo,
      parteContraria,
      juizo: campo(region, L_JUI, [L_SINT, /\n\s*1\s*\./]),
      sinteseDoPedido: campo(region, L_SINT, [L_STAT, /\n\s*2\s*\./]),
      status: campo(region, L_STAT, [L_VAL, /\n\s*3\s*\./]),
      valorCausa: campo(region, L_VAL, [L_AUD, /V\.\s*ESTIMADO/i, /\n?\s*4\s*\./]),
      audiencia: campo(region, L_AUD, [L_OBS, /\n\s*5\s*\./]),
    });
  }
  return { cliente, processos };
}

// ---------- Planilha (.xlsx/.xlsm) → clientes ----------
export type ClienteImportado = {
  nome: string;
  emails: string;
  corpoEmail: string;
  nomeArquivo: string;
  tipo: string;
};

// Lê uma planilha .xlsx/.xlsm e devolve as linhas como mapa de colunas (A, B, …).
// A primeira linha (cabeçalho) é descartada.
async function lerLinhasPlanilha(
  buf: ArrayBuffer,
): Promise<Record<string, string>[]> {
  const zip = await JSZip.loadAsync(buf);
  const ssFile = zip.file("xl/sharedStrings.xml");
  const shared: string[] = [];
  if (ssFile) {
    const ss = await ssFile.async("string");
    for (const m of ss.match(/<si>[\s\S]*?<\/si>/g) ?? []) {
      const txt = m
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#10;/g, "\n")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      shared.push(txt);
    }
  }
  const sheetFile =
    zip.file("xl/worksheets/sheet1.xml") ??
    zip.file(/xl\/worksheets\/sheet\d+\.xml/)[0];
  if (!sheetFile) return [];
  const data = await sheetFile.async("string");
  const rows = data.match(/<row[^>]*>[\s\S]*?<\/row>/g) ?? [];
  const out: Record<string, string>[] = [];
  for (let ri = 1; ri < rows.length; ri++) {
    const cells: Record<string, string> = {};
    for (const cm of rows[ri].matchAll(
      /<c\s+r="([A-Z]+)\d+"([^>]*)>(?:<v>([\s\S]*?)<\/v>)?/g,
    )) {
      const col = cm[1];
      const attrs = cm[2] || "";
      const raw = cm[3];
      if (raw == null || raw === "") continue;
      const isShared = /t="s"/.test(attrs);
      cells[col] = isShared ? (shared[parseInt(raw, 10)] ?? "") : raw;
    }
    out.push(cells);
  }
  return out;
}

export async function parsePlanilhaClientes(
  buf: ArrayBuffer,
): Promise<ClienteImportado[]> {
  const rows = await lerLinhasPlanilha(buf);
  const clientes: ClienteImportado[] = [];
  for (const cells of rows) {
    const nome = (cells["A"] || "").trim();
    if (!nome) continue;
    clientes.push({
      nome,
      emails: (cells["B"] || "").trim(),
      corpoEmail: (cells["C"] || "").trim(),
      tipo: (cells["D"] || "").trim(),
      nomeArquivo: (cells["E"] || "").trim(),
    });
  }
  return clientes;
}

// ---------- Planilha de contatos (export do Legal One) ----------
// Colunas: A=Nome/Razão social, B=CPF/CNPJ, C=Profissão/Nome fantasia,
// D=Telefone, E=E-mail, F=Grupos, G=Classificações, H=Tipo (Pessoa física/jurídica).
export type ContatoImportado = {
  tipo: "pf" | "pj";
  nome: string;
  documento: string;
  profissao: string;
  telefone: string;
  email: string;
  grupos: string;
  classificacao: string;
  tipoContato: string;
  ativo: boolean;
};

// Grupos (ou, na falta, Classificações) → tipoContato do sistema.
function classificarTipoContato(grupos: string, classif: string): string {
  const g = (grupos.split(";")[0] || "").trim().toLowerCase();
  const mapa: [RegExp, string][] = [
    [/advogad/, "advogado_contrario"],
    [/parte contr|contrári/, "parte_contraria"],
    [/parte do processo/, "parte_processo"],
    [/client/, "cliente"],
    [/fornecedor|prestador/, "fornecedor"],
    [/escrit[óo]rio/, "correspondente"],
    [/pessoal dr|interno/, "interno"],
    [/perito/, "perito"],
  ];
  for (const [re, tipo] of mapa) if (re.test(g)) return tipo;
  // Sem grupo útil: tenta pela classificação.
  const c = classif.toLowerCase();
  if (/advogado contr/.test(c)) return "advogado_contrario";
  if (/contrári/.test(c)) return "parte_contraria";
  if (/client/.test(c)) return "cliente";
  if (/fornecedor/.test(c)) return "fornecedor";
  if (/respons[áa]vel|usu[áa]rio/.test(c)) return "interno";
  return "diverso";
}

export async function parsePlanilhaContatos(
  buf: ArrayBuffer,
): Promise<ContatoImportado[]> {
  const rows = await lerLinhasPlanilha(buf);
  const out: ContatoImportado[] = [];
  for (const cells of rows) {
    const nome = (cells["A"] || "").trim();
    if (!nome) continue;
    const grupos = (cells["F"] || "").trim();
    const classificacao = (cells["G"] || "").trim();
    const tipoH = (cells["H"] || "").toLowerCase();
    const c = classificacao.toLowerCase();
    // "inativo" sem nenhum "ativo" solto → contato inativo.
    const ativo = !(/inativ/.test(c) && !/(^|[^n])ativ/.test(c));
    out.push({
      tipo: /jur[íi]dic/.test(tipoH) ? "pj" : "pf",
      nome,
      documento: (cells["B"] || "").trim(),
      profissao: (cells["C"] || "").trim(),
      telefone: (cells["D"] || "").trim(),
      email: (cells["E"] || "").trim(),
      grupos,
      classificacao,
      tipoContato: classificarTipoContato(grupos, classificacao),
      ativo,
    });
  }
  return out;
}
