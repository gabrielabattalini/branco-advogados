import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { RelatorioDiario, PessoaDia } from "@/lib/data";
import { dataPorExtenso } from "@/lib/hoje";

const NAVY = "#056235";
const GOLD = "#B0894F";
const CREAM = "#F6F3EC";
const INK = "#2A2A28";
const MUTED = "#6E6A60";
const FAINT = "#9A9488";
const LINE = "#E5E0D5";

const s = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 46,
    paddingHorizontal: 0,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: INK,
    position: "relative",
  },
  watermark: {
    position: "absolute",
    top: 320,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Times-Bold",
    fontSize: 76,
    color: "#F0ECE1",
  },
  header: {
    backgroundColor: NAVY,
    paddingVertical: 22,
    paddingHorizontal: 40,
    marginBottom: 22,
  },
  brand: {
    fontFamily: "Times-Bold",
    fontSize: 22,
    color: CREAM,
    letterSpacing: 1,
  },
  brandSub: {
    fontFamily: "Times-Roman",
    fontSize: 9,
    color: GOLD,
    letterSpacing: 3,
    marginTop: 2,
  },
  headTitle: { color: CREAM, fontSize: 12, marginTop: 12, fontFamily: "Helvetica-Bold" },
  headDate: { color: "#CFE3D6", fontSize: 9.5, marginTop: 2 },
  body: { paddingHorizontal: 40 },
  resumoLinha: {
    fontSize: 9.5,
    color: MUTED,
    marginBottom: 16,
  },
  pessoa: { marginBottom: 16, breakInside: "avoid" },
  pessoaHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1.5,
    borderBottomColor: NAVY,
    paddingBottom: 4,
    marginBottom: 6,
  },
  pessoaNome: { fontFamily: "Helvetica-Bold", fontSize: 12.5, color: NAVY },
  chips: { flexDirection: "row" },
  chip: {
    fontSize: 8,
    color: "#FFFFFF",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginLeft: 4,
  },
  acao: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 2.5,
    borderBottomWidth: 0.5,
    borderBottomColor: LINE,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 3.5, marginRight: 7 },
  hora: { width: 34, color: FAINT, fontSize: 9 },
  acaoTexto: { flex: 1, fontSize: 9.5, color: INK },
  acaoTarefa: { color: MUTED, fontFamily: "Helvetica-Oblique" },
  vazio: { fontSize: 10, color: FAINT, marginTop: 20, textAlign: "center" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: LINE,
    paddingTop: 6,
    fontSize: 8,
    color: FAINT,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function corTipo(tipo: string): string {
  switch (tipo) {
    case "criacao":
      return NAVY;
    case "status":
      return GOLD;
    case "comentario":
      return "#2F6F8F";
    case "prazo":
      return "#C0892E";
    default:
      return FAINT;
  }
}

function Chips({ p }: { p: PessoaDia }) {
  const items: [string, number, string][] = [
    ["concluídas", p.concluidas, "#2E7D52"],
    ["revisão", p.revisao, "#C0892E"],
    ["criadas", p.criadas, NAVY],
    ["comentários", p.comentarios, "#2F6F8F"],
  ];
  return (
    <View style={s.chips}>
      {items
        .filter(([, n]) => n > 0)
        .map(([label, n, cor]) => (
          <Text key={label} style={[s.chip, { backgroundColor: cor }]}>
            {n} {label}
          </Text>
        ))}
    </View>
  );
}

function Pessoa({ p }: { p: PessoaDia }) {
  return (
    <View style={s.pessoa} wrap={false}>
      <View style={s.pessoaHead}>
        <Text style={s.pessoaNome}>{p.nome}</Text>
        <Chips p={p} />
      </View>
      {p.acoes.map((a, i) => (
        <View key={i} style={s.acao}>
          <View style={[s.dot, { backgroundColor: corTipo(a.tipo) }]} />
          <Text style={s.hora}>{a.hora}</Text>
          <Text style={s.acaoTexto}>
            {a.texto} <Text style={s.acaoTarefa}>— {a.tarefa}</Text>
          </Text>
        </View>
      ))}
    </View>
  );
}

function Relatorio({ rel }: { rel: RelatorioDiario }) {
  const totalPessoas = rel.pessoas.length;
  return (
    <Document title={`Relatório diário — ${rel.data}`}>
      <Page size="A4" style={s.page}>
        <Text style={s.watermark} fixed>
          BRANCO
        </Text>
        <View style={s.header}>
          <Text style={s.brand}>BRANCO</Text>
          <Text style={s.brandSub}>ADVOGADOS</Text>
          <Text style={s.headTitle}>Relatório de Atividades do Dia</Text>
          <Text style={s.headDate}>{dataPorExtenso(rel.data)}</Text>
        </View>
        <View style={s.body}>
          {rel.total > 0 ? (
            <Text style={s.resumoLinha}>
              {rel.total} {rel.total === 1 ? "ação registrada" : "ações registradas"} ·{" "}
              {totalPessoas} {totalPessoas === 1 ? "pessoa" : "pessoas"}
            </Text>
          ) : null}
          {rel.pessoas.length === 0 ? (
            <Text style={s.vazio}>
              Nenhuma atividade registrada neste dia.
            </Text>
          ) : (
            rel.pessoas.map((p) => <Pessoa key={p.iniciais} p={p} />)
          )}
        </View>
        <View style={s.footer} fixed>
          <Text>Branco Advogados · relatório gerado automaticamente</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber}/${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export async function gerarPdfRelatorioDiario(
  rel: RelatorioDiario,
): Promise<Buffer> {
  return renderToBuffer(<Relatorio rel={rel} />);
}
