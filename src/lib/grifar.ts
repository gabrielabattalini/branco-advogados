// Pega o PDF original da AASP e GRIFA nele (sem redesenhar): destaca em amarelo
// o dispositivo + as partes e escreve a anotação em vermelho (nomes - tarefa -
// data) no canto superior direito de cada publicação, como o escritório faz à
// mão. Depois separa em dois PDFs (Trabalhista e Cível). Usa pdfjs (posições) +
// pdf-lib (edição).

import { getDocumentProxy } from "unpdf";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { parseAASP, type PublicacaoParsed } from "@/lib/aasp";

export type Anotacao = { nomes: string; tarefa: string; data: string };
type It = { str: string; x: number; y: number; w: number; h: number };
type Pag = { items: It[]; text: string; offs: number[] };

// Vermelho da caneta do escritório.
const VERMELHO = rgb(0.82, 0.1, 0.12);

// Quebra o texto em linhas que cabem na largura disponível (margem direita).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function quebrar(font: any, texto: string, size: number, maxW: number): string[] {
  const palavras = texto.split(/\s+/);
  const linhas: string[] = [];
  let cur = "";
  for (const w of palavras) {
    const t = cur ? cur + " " + w : w;
    if (cur && font.widthOfTextAtSize(t, size) > maxW) {
      linhas.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) linhas.push(cur);
  return linhas.slice(0, 4);
}

async function extrair(bytes: Uint8Array): Promise<Pag[]> {
  const pj = await getDocumentProxy(bytes);
  const pages: Pag[] = [];
  for (let i = 1; i <= pj.numPages; i++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pg: any = await pj.getPage(i);
    const c = await pg.getTextContent();
    const items: It[] = c.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((x: any) => typeof x.str === "string" && x.str.length)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((it: any) => ({
        str: it.str,
        x: it.transform[4],
        y: it.transform[5],
        w: it.width || 0,
        h: it.height || 9,
      }));
    let text = "";
    const offs: number[] = [];
    for (const it of items) {
      offs.push(text.length);
      text += it.str + " ";
    }
    pages.push({ items, text, offs });
  }
  return pages;
}

function itemNoOffset(p: Pag, off: number): It | null {
  let yi = -1;
  for (let k = 0; k < p.offs.length; k++) {
    if (p.offs[k] <= off) yi = k;
    else break;
  }
  return yi >= 0 ? p.items[yi] : null;
}
function itensNoIntervalo(p: Pag, s: number, e: number): It[] {
  const out: It[] = [];
  for (let k = 0; k < p.items.length; k++) {
    const a = p.offs[k];
    const b = a + p.items[k].str.length;
    if (b > s && a < e) out.push(p.items[k]);
  }
  return out;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function grifa(page: any, its: It[]) {
  for (const it of its) {
    if (!it.w) continue;
    page.drawRectangle({
      x: it.x - 0.5,
      y: it.y - 1.5,
      width: it.w + 1,
      height: it.h + 2,
      color: rgb(1, 0.92, 0.3),
      opacity: 0.5,
    });
  }
}

export type GrifadoSaida = {
  data: string; // ISO da disponibilização (para o nome do arquivo)
  trabalhista: Uint8Array | null;
  civel: Uint8Array | null;
};

const MARCADORES_DISPOSITIVO = [
  "DISPOSITIVO",
  "ISSO POSTO",
  "Posto isso",
  "HOMOLOGO",
  "Ante o exposto",
  "decido",
  "JULGO",
  "JULGAR",
  "DEFIRO",
  "Defiro",
  "manifeste-se",
  "manifestar-se",
  "Manifeste-se",
  "Intime-se",
  "Vistos",
];

export async function grifarAASP(
  bytes: Uint8Array,
  anotar: (p: PublicacaoParsed) => Anotacao,
): Promise<GrifadoSaida> {
  const paraEditar = bytes.slice(); // cópia: o pdfjs "detacha" o buffer original
  const pages = await extrair(bytes);
  const pubs = parseAASP(pages.map((p) => p.text).join("\n"));

  const heads: { page: number; off: number }[] = [];
  for (let pi = 0; pi < pages.length; pi++) {
    const re = /(\d{1,3}) - (?:D J E N|TRT)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(pages[pi].text))) heads.push({ page: pi, off: m.index });
  }

  const doc = await PDFDocument.load(paraEditar);
  const dp = doc.getPages();
  const fontB = await doc.embedFont(StandardFonts.HelveticaBold);

  const areasPorPag: Set<string>[] = pages.map(() => new Set<string>());
  const n = Math.min(heads.length, pubs.length);
  for (let i = 0; i < n; i++) {
    const h = heads[i];
    const pub = pubs[i];
    const pg = pages[h.page];
    const pdfp = dp[h.page];
    const W = pdfp.getWidth();
    const itHead = itemNoOffset(pg, h.off);
    const y = itHead ? itHead.y : pdfp.getHeight() - 60;

    // Anotação no canto superior direito, em vermelho (pula duplicatas IDEM):
    // "Responsável / Revisor - Tarefa - Data", como o escritório faz à mão.
    if (pub.duplicataDe == null) {
      const a = anotar(pub);
      const texto = [a.nomes, a.tarefa, a.data].filter(Boolean).join(" - ");
      if (texto) {
        const size = 11;
        const maxW = 215;
        const x = W - maxW - 6;
        let yy = y;
        for (const ln of quebrar(fontB, texto, size, maxW)) {
          pdfp.drawText(ln, { x, y: yy, size, font: fontB, color: VERMELHO });
          yy -= size + 2.5;
        }
      }
    }

    // Grifo: partes + dispositivo.
    const gtxt = (frag: string) => {
      if (!frag || frag.length < 5) return;
      const idx = pg.text.indexOf(frag.slice(0, 38));
      if (idx >= 0) grifa(pdfp, itensNoIntervalo(pg, idx, idx + frag.length));
    };
    gtxt(pub.poloAtivo);
    gtxt(pub.poloPassivo);
    for (const mk of MARCADORES_DISPOSITIVO) {
      const di = pg.text.indexOf(mk);
      if (di >= 0) {
        grifa(pdfp, itensNoIntervalo(pg, di, di + 165));
        break;
      }
    }

    // Marca a área das páginas que esta publicação ocupa.
    const fim = i + 1 < heads.length ? heads[i + 1].page : pages.length - 1;
    for (let pp = h.page; pp <= fim; pp++) areasPorPag[pp]?.add(pub.area);
  }

  const data = pubs.find((p) => p.disponibilizacao)?.disponibilizacao ?? "";

  const montar = async (area: string): Promise<Uint8Array | null> => {
    const idxs = areasPorPag
      .map((s, i) => (s.has(area) ? i : -1))
      .filter((i) => i >= 0);
    if (!idxs.length) return null;
    const nd = await PDFDocument.create();
    const copied = await nd.copyPages(doc, idxs);
    copied.forEach((p) => nd.addPage(p));
    return nd.save();
  };

  return {
    data,
    trabalhista: await montar("trabalhista"),
    civel: await montar("civel"),
  };
}
