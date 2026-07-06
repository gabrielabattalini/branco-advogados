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
};
export type RelatorioImportado = {
  cliente: string;
  processos: ProcessoImportado[];
};

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

export async function parsePlanilhaClientes(
  buf: ArrayBuffer,
): Promise<ClienteImportado[]> {
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
  const clientes: ClienteImportado[] = [];
  const rows = data.match(/<row[^>]*>[\s\S]*?<\/row>/g) ?? [];
  for (let ri = 0; ri < rows.length; ri++) {
    if (ri === 0) continue; // cabeçalho
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
