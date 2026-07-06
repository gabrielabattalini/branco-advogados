import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { TIMBRADO_DATA_URI } from "@/lib/timbrado";

const INK = "#1f2420";
const GREEN = "#056235";
const RED = "#a12a1e";

export type ProcRelCliente = {
  numero: string;
  parteContrariaTipo: string;
  parteContraria: string;
  juizo: string;
  sinteseDoPedido: string;
  status: string[]; // lançamentos (mais recente primeiro)
  valorCausa: string;
  valorEstimado: string;
  audiencia: string;
  observacoes: string;
};
export type RelatorioClienteDados = {
  cliente: string;
  mesAno: string; // ex.: "JUNHO DE 2026"
  processos: ProcRelCliente[];
};

const s = StyleSheet.create({
  // Área útil dentro do timbrado (borda + logo no topo + rodapé embaixo).
  page: { paddingTop: 118, paddingBottom: 92, paddingHorizontal: 62, fontFamily: "Helvetica", fontSize: 9.5, color: INK },
  bg: { position: "absolute", top: 0, left: 0, width: 595.28, height: 841.89 },
  titulo: { fontFamily: "Helvetica-Bold", fontSize: 11, textAlign: "center", marginBottom: 8 },
  aviso: { borderWidth: 1, borderColor: RED, borderRadius: 3, padding: 5, marginBottom: 12 },
  avisoT: { color: RED, fontFamily: "Helvetica-Bold", fontSize: 8, textAlign: "center", lineHeight: 1.4 },
  cliente: { fontFamily: "Helvetica-Bold", fontSize: 10, color: GREEN, marginBottom: 8 },
  proc: { marginBottom: 11, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: "#d8d3c8" },
  parte: { fontFamily: "Helvetica-Bold", fontSize: 9.5, marginBottom: 2 },
  linhaProc: { fontFamily: "Helvetica-Bold", fontSize: 9, color: GREEN, marginBottom: 4 },
  campo: { marginBottom: 2.5, lineHeight: 1.4 },
  rot: { fontFamily: "Helvetica-Bold" },
  lanc: { marginBottom: 1.5, lineHeight: 1.4 },
});

function Campo({ rotulo, valor }: { rotulo: string; valor?: string }) {
  if (!valor) return null;
  return (
    <Text style={s.campo}>
      <Text style={s.rot}>{rotulo} </Text>
      {valor}
    </Text>
  );
}

function Proc({ p, ordem }: { p: ProcRelCliente; ordem: number }) {
  const rom = romano(ordem);
  const tipo = p.parteContrariaTipo ? ` (${p.parteContrariaTipo})` : "";
  return (
    // Sem wrap={false}: blocos longos (status grande) quebram entre páginas
    // em vez de transbordar por cima do cabeçalho.
    <View style={s.proc}>
      {/* O cabeçalho do processo fica junto (não fica órfão no fim da página). */}
      <View wrap={false} minPresenceAhead={30}>
        <Text style={s.parte}>
          {rom} - PARTE CONTRÁRIA{tipo}: {p.parteContraria || "—"}
        </Text>
        <Text style={s.linhaProc}>
          PROCESSO n. {p.numero}    {p.juizo ? `JUÍZO: ${p.juizo}` : ""}
        </Text>
      </View>
      <Campo rotulo="1. SÍNTESE DO PEDIDO:" valor={p.sinteseDoPedido} />
      <View style={s.campo}>
        <Text style={s.rot}>2. SITUAÇÃO ATUAL (STATUS):</Text>
        {p.status.length ? (
          p.status.map((l, i) => (
            <Text key={i} style={s.lanc}>
              • {l}
            </Text>
          ))
        ) : (
          <Text style={s.lanc}>—</Text>
        )}
      </View>
      <Campo
        rotulo="3. VALOR DA CAUSA:"
        valor={
          [p.valorCausa, p.valorEstimado ? `V. estimado: ${p.valorEstimado}` : ""]
            .filter(Boolean)
            .join("    ") || undefined
        }
      />
      <Campo rotulo="4. AUDIÊNCIA:" valor={p.audiencia || "Não há."} />
      <Campo rotulo="5. OBSERVAÇÕES:" valor={p.observacoes || " "} />
    </View>
  );
}

function romano(n: number): string {
  const un = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
  const dez = ["", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC"];
  const cem = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM"];
  if (n < 1 || n > 399) return String(n);
  return cem[Math.floor(n / 100) % 10] + dez[Math.floor(n / 10) % 10] + un[n % 10];
}

function Relatorio({ dados }: { dados: RelatorioClienteDados }) {
  return (
    <Document title={`Relatório ${dados.cliente}`}>
      <Page size="A4" style={s.page}>
        <Image src={TIMBRADO_DATA_URI} style={s.bg} fixed />
        <Text style={s.titulo}>
          RELATÓRIO DE ANDAMENTO PROCESSUAL CÍVEL DE {dados.mesAno}.
        </Text>
        <View style={s.aviso}>
          <Text style={s.avisoT}>
            CUIDADO: GOLPE DO FALSO ADVOGADO!{"\n"}NÃO PEDIMOS
            DINHEIRO/PIX/DEPÓSITO.{"\n"}DÚVIDAS? LIGUE 4586.6329 (único tel.
            escritório)
          </Text>
        </View>
        <Text style={s.cliente}>CLIENTE: {dados.cliente}</Text>
        {dados.processos.map((p, i) => (
          <Proc key={p.numero + i} p={p} ordem={i + 1} />
        ))}
      </Page>
    </Document>
  );
}

export async function gerarPdfRelatorioCliente(
  dados: RelatorioClienteDados,
): Promise<Buffer> {
  return renderToBuffer(<Relatorio dados={dados} />);
}
